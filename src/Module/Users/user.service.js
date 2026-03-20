import { logoutEnum } from '../../common/enums/security.enum.js';
import { baseRevokeTokenKey, deleteKeys, keys, revokeTokenKey, set } from '../../common/services/index.js';
import { compareHash, ConflictError, decrypt, generateHash } from '../../common/utils/index.js';
import { createTokenLogin } from '../../common/utils/security/token.security.js';
import { findOne, userModel, updateMany, findByIdAndUpdate, createOne, tokenModel, deleteMany } from '../../db/index.js';
import { hash } from 'bcrypt';
/**
 * Revokes a specific token by adding its JTI to the blacklist in Redis.
 * @param {Object} params - Includes userId, jti, and ttl.
 */
const createRevokeToken = async ({ userId, jti, ttl }) => {
    await set({
        key: revokeTokenKey({ userId, jti }),
        value: jti,
        ttl: ttl || (parseInt(process.env.REFRESH_EXPIRE_IN_DEV) || 31536000)
    })
}

/**
 * Logs out a user by revoking their current session or all sessions.
 * @param {string} flag - logoutEnum (single or all).
 * @param {Object} user - The user document.
 * @param {Object} decoded - The decoded token payload.
 * @returns {number} The HTTP status code.
 */
export const logout = async (flag, user, { jti, iat, sub }) => {
    let status = 200
    switch (flag) {
        case logoutEnum.all:
            user.changeCredentialTime = new Date()
            await user.save()
            await deleteKeys(await keys(baseRevokeTokenKey(sub)))
            await deleteMany({ model: tokenModel, filter: { userId: user._id } })
            break;
        default:
            await createRevokeToken({
                userId: user._id,
                jti,
                ttl: parseInt(process.env.REFRESH_EXPIRE_IN_DEV) || 31536000
            })
            status = 201
            break;
    }
    return status
}

/**
 * Updates the user's profile image.
 * @param {Object} file - The uploaded file object.
 * @param {Object} user - The authenticated user.
 */
export const getProfileImage = async (file, user) => {
    return await findByIdAndUpdate({
        model: userModel,
        id: user._id,
        data: { profileImage: file.finalpath }
    });
}

export const profileCover = async (file, user) => {
    return await findByIdAndUpdate({
        model: userModel,
        id: user._id,
        data: { coverPics: [file.finalpath] }
    });
}

export const getProfile = async (user) => {
    return user;
}

export const getProfileViews = async (userId) => {
    const user = await findOne({
        model: userModel,
        filter: { _id: userId },
        populate: [{
            path: 'profileViews',
            select: 'firstName lastName email image'
        }]
    });
    return user ? user.profileViews : [];
}

/**
 * Retrieves a user profile and logs the viewer in profile views.
 * @param {string} userId - ID of the profile to view.
 * @param {Object} viewer - The authenticated user viewing the profile.
 * @returns {Object} The user profile.
 */
export const shsareProfile = async (userId, viewer) => {
    const profile = await findOne({
        model: userModel,
        filter: { _id: userId },
        select: "firstName lastName email phone image profileViews"
    })

    if (!profile) {
        throw new NotFoundError({ message: "The requested profile could not be found." });
    }

    if (profile.phone) {
        profile.phone = await decrypt(profile.phone)
    }

    // Add the viewer to profileViews if not already present and not viewing own profile
    if (userId && viewer && viewer._id.toString() !== profile._id.toString()) {
        const hasViewed = profile.profileViews.some(viewId => viewId.toString() === viewer._id.toString());
        if (!hasViewed) {
            await updateMany({
                model: userModel,
                filter: { _id: profile._id },
                data: { $push: { profileViews: viewer._id } }
            });
        }
    }

    return profile
}

export const rotateToken = async (user, { sub, jti, iat }, issuer) => {
    if ((iat + (parseInt(process.env.ACCESS_EXPIRE_IN_DEV) || 18000)) * 1000 >= Date.now() + (30000)) {
        throw new ConflictError({ message: "Current access token is still valid. Refresh is not required yet." })
    }

    await createRevokeToken({
        userId: user._id,
        jti,
        ttl: parseInt(process.env.REFRESH_EXPIRE_IN_DEV) || 31536000
    })

    return await createTokenLogin(user, issuer);
}



export const updatePassword = async ({ oldPassword, password }, user, issuer) => {
    if (!await compareHash({ plainText: oldPassword, cipherText: user.password })) {
        throw ConflictError({ message: "Invalid current password." })
    }

    for (const hash of user.oldPassword || []) {
        if (await compareHash({ plainText: password, cipherText: hash })) {
            throw ConflictError({ message: "Cannot reuse a previously used password." })
        }
    }

    user.oldPassword.push(user.password)

    user.password = await generateHash({ plainText: password })
    user.changeCredentialTime = new Date()
    await user.save()

    await deleteKeys(await keys(baseRevokeTokenKey(user._id)))

    return await createTokenLogin(user, issuer)
}