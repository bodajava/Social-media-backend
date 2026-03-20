import { Router } from "express";
import * as authService from "./auth.service.js";
import { successResponse } from "../../common/utils/res/success.res.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as validator from './auth.validation.js'
import { validation } from "../../middleware/validation.middleware.js";
import rateLimit from "express-rate-limit";
import geoip from "geoip-lite";
import { redisClient } from "../../db/redis.connection.db.js";
const authRouter = Router();

const loginLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    limit: async function (req) {
        if (!req.ip) return 1;
        const geo = geoip.lookup(req.ip)
        if (req.ip === '127.0.0.1' || req.ip === '::1') return 5
        if (!geo) return 1
        return geo.country == "EG" ? 5 : 0
    },
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: true,
    handler: (req, res, next) => {
        return res.status(429).json({ message: "Too many requests. Please try again later." })
    },
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown-ip'
    },
    validate: { keyGeneratorIpFallback: false }, // Resolves ERR_ERL_KEY_GEN_IPV6 warning when using custom keyGenerator without the helper

    store: {
        async increment(key) {
            const count = await redisClient.incr(key)
            if (count === 1) await redisClient.expire(key, 120) // 120 seconds (2 mins)
            return { totalHits: count, resetTime: undefined }
        },
        async decrement(key) {
            try {
                if (await redisClient.exists(key)) {
                    await redisClient.decr(key)
                }
            } catch (error) {
                console.error("Redis decrement error:", error.message)
            }
        },
        async resetKey(key) {
            await redisClient.del(key)
        }
    }
})

/**
 * Auth Router - Handles all authentication and password management routes.
 */

/**
 * Endpoint to reset password using an OTP.
 */
authRouter.patch('/reset-forget-password-code', loginLimiter, validation(validator.resetForgetPassword), asyncHandler(async (req, res, next) => {
    const result = await authService.restForgetPasswordCodeOtp(req.body);
    return successResponse({ res, message: result.message, statusCode: 200 });
}));

/**
 * Endpoint for user registration.
 */
authRouter.post('/signup', loginLimiter, validation(validator.signup), asyncHandler(async (req, res, next) => {
    const result = await authService.signup(req.body, `${req.protocol}:\/\/${req.host}`);
    return successResponse({ res, message: result.message, statusCode: 201 });
}));

/**
 * Endpoint to request a password reset code.
 */
authRouter.post('/reqest-forget-password-code', loginLimiter, validation(validator.resendConfirmEmail), asyncHandler(async (req, res, next) => {
    const result = await authService.reqestForgetPasswordCode(req.body);
    return successResponse({ res, message: result.message, statusCode: 200 });
}));

/**
 * Endpoint to verify a password reset OTP.
 */
authRouter.patch('/verify-forget-password-otp', loginLimiter, validation(validator.confirmEmail), asyncHandler(async (req, res, next) => {
    const result = await authService.verifyForgetPasswordOtp(req.body);
    return successResponse({ res, message: result.message, statusCode: 200 });
}));

/**
 * Endpoint to resend the confirmation email OTP.
 */
authRouter.patch('/resend-email-otp', loginLimiter, validation(validator.resendConfirmEmail), asyncHandler(async (req, res, next) => {
    await authService.resendConfirmEmail(req.body);
    return successResponse({ res, message: "A new confirmation code has been sent to your email.", statusCode: 200 });
}));

/**
 * Endpoint to confirm email and activate the account.
 */
authRouter.patch('/confirm-email', validation(validator.confirmEmail), asyncHandler(async (req, res, next) => {
    const account = await authService.confirmEmail(req.body);
    return successResponse({ res, message: "Your email has been confirmed successfully! Your account is now active.", statusCode: 200, data: { ...account } });
}));

/**
 * Endpoint for user login.
 */
authRouter.post('/login', loginLimiter, validation(validator.login), asyncHandler(async (req, res, next) => {
    const credentials = await authService.login(req.body, `${req.protocol}:\/\/${req.host}`);
    return successResponse({ res, message: "Login successful. Welcome back!", statusCode: 200, data: { ...credentials } });
}));

/**
 * Google OAuth registration endpoint.
 */
authRouter.post('/signup/gmail', asyncHandler(async (req, res, next) => {
    const { user, statusCode, message } = await authService.signupWithGmail(req.body, `${req.protocol}:\/\/${req.host}`);
    return successResponse({ res, message, statusCode, data: { ...user } });
}));

/**
 * Google OAuth login endpoint.
 */
authRouter.post('/login/gmail', asyncHandler(async (req, res, next) => {
    const { user, statusCode = 200 } = await authService.loginWithGmail(req.body, `${req.protocol}:\/\/${req.host}`)
    return successResponse({ res, message: "Login successful.", statusCode, data: { ...user } });
}));

/**
 * Unified Google OAuth signin/signup endpoint.
 */
authRouter.post('/gmail', asyncHandler(async (req, res, next) => {
    const { credentials, isNew } = await authService.googleSiginupAndLogin(req.body, `${req.protocol}:\/\/${req.host}`)
    return successResponse({ res, message: "Login successful.", statusCode: isNew ? 201 : 200, data: { ...credentials } });
}));

export default authRouter;
