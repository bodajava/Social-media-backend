import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { successResponse } from '../../common/utils/index.js'
import * as userService from './user.service.js'
import { authentcationMiddleWare, authorization } from '../../middleware/authentcation.middleware.js';
import { tokenTypeEnum } from '../../common/enums/security.enum.js';
import { RoleEnum } from '../../common/enums/user.enume.js';
import { validation } from '../../middleware/index.js';
import * as validator from './userValidation.js'
import { localFileUpload } from '../../common/utils/multer/local.multer.js';
import { fileFaildValifation } from '../../common/utils/multer/index.js';

const userRouter = Router()



/**
 * User Router - Handles profile management, account settings, and token rotation.
 */

/**
 * Endpoint to update user password while authenticated.
 */
userRouter.patch(
    "/Password",
    authentcationMiddleWare(),
    authorization([RoleEnum.User, RoleEnum.Admin]),
    validation(validator.updatePassword),
    async (req, res, next) => {
        const credentials = await userService.updatePassword(req.body, req.user, `${req.protocol}:\/\/${req.host}`);
        return successResponse({ res, message: "Your password has been updated successfully.", data: { ...credentials } });
    }
);

/**
 * Endpoint to logout from current or all sessions.
 */
userRouter.post('/logout', authentcationMiddleWare(), asyncHandler(async (req, res, next) => {
    const flag = req.body?.flag !== undefined ? req.body.flag : req.body?.flage;
    const status = await userService.logout(flag, req.user, req.decoded)
    return successResponse({ res, message: "You have been logged out successfully. See you soon!", data: { status } })
}))

/**
 * Endpoint to update profile picture.
 */
userRouter.patch(
    "/profile/image",
    authentcationMiddleWare(),
    authorization([RoleEnum.User, RoleEnum.Admin]),
    localFileUpload({
        customPath: "profile",
        validation: fileFaildValifation.image,
        maxSize: 1
    }).single("attachment"),
    validation(validator.getProfileImage),
    async (req, res, next) => {
        const account = await userService.getProfileImage(req.file, req.user);
        return successResponse({ res, message: "Profile picture updated successfully!", data: { ...account } });
    }
);

/**
 * Endpoint to update profile cover image.
 */
userRouter.patch(
    "/profile-cover-image",
    authentcationMiddleWare(),
    authorization([RoleEnum.User, RoleEnum.Admin]),
    localFileUpload({
        customPath: "profile",
        validation: fileFaildValifation.image,
        maxSize: 10
    }).single("attachment"),
    validation(validator.profileCover),
    async (req, res, next) => {
        const account = await userService.profileCover(req.file, req.user);
        return successResponse({ res, message: "Profile cover image updated successfully!", data: { ...account } });
    }
);

/**
 * Endpoint to retrieve own profile details.
 */
userRouter.get('/profile', authentcationMiddleWare(), authorization([RoleEnum.User, RoleEnum.Admin]), asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user);
    return successResponse({ res, message: "Profile details retrieved successfully.", data: { ...user }, statusCode: 200 })
}))

/**
 * Endpoint to view who has visited the user profile.
 */
userRouter.get('/profile/views', authentcationMiddleWare(), authorization([RoleEnum.User, RoleEnum.Admin]), asyncHandler(async (req, res) => {
    const views = await userService.getProfileViews(req.user._id);
    return successResponse({ res, message: "Your profile views have been retrieved successfully.", data: { views }, statusCode: 200 })
}))

/**
 * Endpoint to view another user's public profile.
 */
userRouter.get('/profile/:userId/share', validation(validator.shsareProfile), authentcationMiddleWare(), authorization([RoleEnum.User, RoleEnum.Admin]), asyncHandler(async (req, res) => {
    const user = await userService.shsareProfile(req.params.userId, req.user);
    return successResponse({ res, message: "Public profile retrieved successfully.", data: { ...user }, statusCode: 200 })
}))

/**
 * Endpoint to rotate access tokens using a valid refresh token.
 */
userRouter.get('/refresh-token', authentcationMiddleWare(tokenTypeEnum.Refresh), asyncHandler(async (req, res) => {
    const credentials = await userService.rotateToken(req.user, req.decoded, `${req.protocol}:\/\/${req.host}`)
    return successResponse({ res, message: "Session refreshed successfully.", data: { ...credentials }, statusCode: 200 })
}))

export default userRouter