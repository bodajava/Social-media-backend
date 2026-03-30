import { userModel, findOne, createOne, findOneAndUpdate } from '../../db/index.js';
import { compare } from 'bcrypt';
import { generateHash, encrypt, sendEmail, ctrateNumberOtp, emailTemplet, compareHash, emailEvent } from '../../common/utils/index.js';
import { BadRequestError, ConflictError, errorExecution, NotFoundError } from '../../common/utils/res/error.res.js';
import { OAuth2Client } from "google-auth-library";
import { providerEnum } from '../../common/enums/user.enume.js';
import { createTokenLogin } from '../../common/utils/security/token.security.js';
import { bloockOtpKey, get, incr, maxAttempOtp, otpKey, pendingUserKey, set, ttl, del, expire, deleteKeys, keys, baseRevokeTokenKey } from '../../common/services/redids.service.js';
import { EmailEnum } from '../../common/enums/email.enum.js';




const client = new OAuth2Client();
/**
 * Verifies a Google ID Token.
 * @param {string} token - The ID token from the frontend.
 * @returns {Object} The decoded payload.
 */
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: [process.env.GOOGLE_CLIENT_ID],
    });

    const payload = ticket.getPayload();
    return payload
}

/**
 * Resets the user password using an OTP.
 * @param {Object} inputs - Includes email, otp, and new password.
 * @returns {Object} Success message.
 */
export const restForgetPasswordCodeOtp = async (inputs) => {
    const { email, otp, password } = inputs;

    // 1. Verify OTP from Redis
    const otpHashKey = otpKey({ email, subject: EmailEnum.forgetPassword });
    const hashOtp = await get(otpHashKey);

    if (!hashOtp) {
        throw NotFoundError({ message: "Verification code has expired. Please request a new one." });
    }

    if (!await compareHash({ plainText: `${otp}`, cipherText: hashOtp })) {
        throw ConflictError({ message: "Invalid verification code. Please check your email and try again." });
    }

    // 2. Hash the new password
    const hashedPassword = await generateHash({ plainText: password });

    // 3. Update User in Database
    const user = await findOneAndUpdate({
        model: userModel,
        filter: {
            email,
            confirmEmail: true,
            provider: providerEnum.system
        },
        data: {
            password: hashedPassword,
            changeCredentialTime: new Date()
        }
    });

    if (!user) {
        throw NotFoundError({ message: "Account not found or is currently inactive. Please contact support." });
    }

    // 4. Revoke all existing tokens for security and clean up OTP
    const tokenKeys = await keys(`${baseRevokeTokenKey(user._id)}*`) || [];
    const attemptsKey = maxAttempOtp({ email, subject: EmailEnum.forgetPassword });

    await deleteKeys([...tokenKeys, otpHashKey, attemptsKey]);

    return { message: "Your password has been reset successfully. You can now login with your new password." };
}


const sendEmailOtp = async ({ email, subject, title } = {}) => {

    const remainingOtpTtl = await ttl(otpKey({ email, subject }));
    const isBlockedTtl = await ttl(bloockOtpKey({ email, subject }));

    if (isBlockedTtl > 0) {
        throw BadRequestError({ message: `Please wait ${isBlockedTtl} seconds before requesting a new OTP.` })
    }

    if (remainingOtpTtl > 0) {
        throw BadRequestError({ message: `Please wait ${remainingOtpTtl} seconds before requesting a new OTP.` })
    }

    const maxTryial = await get(maxAttempOtp({ email, subject }))

    if (maxTryial >= 3) {
        await set({
            key: bloockOtpKey({ email, subject }),
            value: 1,
            ttl: 7 * 60
        })
        throw BadRequestError({ message: "Too many attempts. Please try again later." });
    }


    const code = await ctrateNumberOtp()
    await set({
        key: otpKey({ email, subject }),
        value: await generateHash({ plainText: `${code}` }),
        ttl: 120
    })

    emailEvent.emit("sendEmail", async () => {
        await sendEmail({
            to: email,
            subject: EmailEnum.confirmEmail,
            html: await emailTemplet({ code, title }),
        })
    })


    await incr(maxAttempOtp({ email, subject }))
    await expire({ key: maxAttempOtp({ email, subject }), ttl: 360 })
}

/**
 * Handles the logic for requesting a password reset code.
 * @param {Object} inputs - Includes the user email.
 * @returns {Object} Success message.
 */
export const reqestForgetPasswordCode = async (inputs) => {
    const { email } = inputs;

    const account = await findOne({
        model: userModel,
        filter: {
            email,
            confirmEmail: true,
            provider: providerEnum.system
        }
    })

    if (!account) {
        throw NotFoundError({ message: "This email address is not registered in our system." });
    }

    await sendEmailOtp({ email, subject: EmailEnum.forgetPassword, title: "Password Reset Request" })

    return { message: "A password reset code has been sent to your email. Please check your inbox (and spam folder)." };
}

export const verifyForgetPasswordOtp = async (inputs) => {
    const { email, otp } = inputs;

    const hashOtp = await get(otpKey({ email, subject: EmailEnum.forgetPassword }));

    if (!hashOtp) {
        throw NotFoundError({ message: "Expired OTP" });
    }

    if (!await compareHash({ plainText: `${otp}`, cipherText: hashOtp })) {
        throw ConflictError({ message: "Invalid OTP." });
    }

    return { message: "OTP is valid." };
}

/**
 * Handles user registration and sends confirmation email.
 * @param {Object} inputs - User registration details.
 * @returns {Object} Success message.
 */
export const signup = async (inputs) => {
    const { firstName, lastName, email, password, phone, gender, address } = inputs;

    const isEmailExist = await findOne({
        model: userModel,
        filter: { email },
    });

    if (isEmailExist) {
        if (isEmailExist.provider !== providerEnum.system) {
            throw ConflictError({
                message: `This email is already registered using ${Object.keys(providerEnum).find(key => providerEnum[key] === isEmailExist.provider).toLowerCase()}. Please login using that service.`
            });
        }
        throw ConflictError({ message: "This email address is already registered. Please login instead." });
    }

    const hashedPassword = await generateHash({ plainText: password });
    const encryptedPhone = phone ? encrypt({ value: phone }) : undefined;

    const userData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: encryptedPhone,
        gender,
        address,
        provider: providerEnum.system
    };

    // Store pending user in Redis for 10 minutes
    await set({
        key: pendingUserKey(email),
        value: userData,
        ttl: 600
    });

    await sendEmailOtp({ email, subject: EmailEnum.confirmEmail, title: "Welcome! Confirm Your Email" })

    return { message: "Registration successful! We've sent a confirmation code to your email. Please check your inbox to activate your account." };
};


export const confirmEmail = async (inputs) => {
    const { email, otp } = inputs;

    const pendingUser = await get(pendingUserKey(email));

    if (!pendingUser) {
        const userExists = await findOne({
            model: userModel,
            filter: { email, confirmEmail: true },
        });
        if (userExists) {
            throw ConflictError({ message: "Email already confirmed. Please login." });
        }
        throw NotFoundError({ message: "No pending registration found for this email" });
    }

    const hashOtp = await get(otpKey({ email, subject: EmailEnum.confirmEmail }));

    if (!hashOtp) {
        throw NotFoundError({ message: "Expired OTP" })
    }

    if (!await compareHash({ plainText: `${otp}`, cipherText: hashOtp })) {
        throw ConflictError({ message: "Invalid OTP" })
    }

    const user = await createOne({
        model: userModel,
        data: {
            ...pendingUser,
            confirmEmail: true
        }
    });

    // Clean up Redis
    await del(pendingUserKey(email));
    await del(otpKey({ email, subject: EmailEnum.confirmEmail }));
    await del(maxAttempOtp({ email, subject: EmailEnum.confirmEmail }));

    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
};

export const resendConfirmEmail = async (inputs) => {
    const { email } = inputs;

    const pendingUser = await get(pendingUserKey(email));

    if (!pendingUser) {
        const userExists = await findOne({
            model: userModel,
            filter: { email, confirmEmail: true },
        });
        if (userExists) {
            throw ConflictError({ message: "Email already confirmed. Please login." });
        }
        throw NotFoundError({ message: "No pending registration found for this email" });
    }

    await sendEmailOtp({ email, subject: EmailEnum.confirmEmail, title: "Verify Your Email" })


    return { message: "Confirmation email resent." };
};


/**
 * Authenticates a user and returns access/refresh tokens.
 * @param {Object} inputs - Includes email and password.
 * @param {string} issuer - The server protocol/host for token issuance.
 * @returns {Object} Access and Refresh tokens.
 */
export const login = async (inputs, issuer) => {
    const { email, password } = inputs;

    const user = await findOne({
        model: userModel,
        filter: { email, confirmEmail: true },
    });

    if (!user) {
        throw ConflictError({ message: "Invalid email or password. Please try again." });
    }

    if (user.provider != providerEnum.system) {
        throw ConflictError({ message: `This account uses ${user.provider} authentication. Please login using your social account.` });
    }

    if (!await compare(password, user.password)) {
        throw ConflictError({ message: "Invalid email or password. Please try again." });
    }

    if (!user.confirmEmail) {
        throw ConflictError({ message: "Your email has not been confirmed yet. Please check your email for the activation code." });
    }

    const tokens = await createTokenLogin(user, issuer);
    return tokens;
};


export const signupWithGmail = async (body, issuer) => {
    const { idToken } = body
    const payload = await verify(idToken)

    if (!payload.email_verified) throw errorExecution({ message: "Email is not verified" })

    const userExist = await findOne({
        model: userModel,
        filter: { email: payload.email }
    })

    if (userExist) {
        if (userExist.provider !== providerEnum.google) {
            throw ConflictError({ message: "Email already exists with another provider." });
        }
        return {
            message: "Login successful.",
            statusCode: 200,
            user: await createTokenLogin(userExist, issuer)
        };
    }



    const newUser = await createOne({
        model: userModel,
        data: {
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            provider: providerEnum.google,
            confirmEmail: true,
            image: { secure_url: payload.picture }
        }
    })

    return {
        message: "User created successfully.",
        statusCode: 201,
        user: await createTokenLogin(newUser, issuer)
    };
}

export const loginWithGmail = async (body, issuer) => {
    const { idToken } = body
    const payload = await verify(idToken)

    if (!payload) throw errorExecution({ message: "Invalid credentials." })

    const user = await findOne({
        model: userModel,
        filter: {
            email: payload.email,
            provider: providerEnum.google,
        }
    })

    if (!user) throw errorExecution({ message: "User not found." })

    return {
        user: await createTokenLogin(user, issuer),
        statusCode: 200
    }
}

export const googleSiginupAndLogin = async (body, issuer) => {
    const { idToken } = body
    const payload = await verify(idToken)
    if (!payload.email_verified) throw errorExecution({ message: "Email address is not verified." })

    const user = await findOne({
        model: userModel,
        filter: {
            email: payload.email
        }
    })
    if (user) {
        if (user.provider === providerEnum.google) {
            return { credentials: await createTokenLogin(user, issuer), isNew: false }
        }
        throw errorExecution({ message: "Email already exists. Please login using your system credentials." })
    }

    const newUser = await createOne({
        model: userModel,
        data: {
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            provider: providerEnum.google,
            confirmEmail: true,
            image: { secure_url: payload.picture }
        }
    })
    const credentials = await createTokenLogin(newUser, issuer)
    return { credentials, isNew: true }
}