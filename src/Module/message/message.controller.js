import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, decodedToken, fileFaildValifation, localFileUpload, successResponse } from '../../common/utils/index.js';
import { deleteMessage, getAllMessage, getMessage, sendMessage } from './message.service.js';
import { validation } from '../../middleware/validation.middleware.js';
import * as validators from './messageValidadtion.js'
import { tokenTypeEnum } from '../../common/enums/security.enum.js';
import { authentcationMiddleWare } from '../../middleware/authentcation.middleware.js';

/**
 * Message Router - Handles sending, listing, and managing private messages.
 */

const messageRouter = Router();

/**
 * Endpoint to send a message to a user.
 * Supports optional authentication for identified senders.
 */
messageRouter.post('/:receiverId',
    asyncHandler(async (req, res, next) => {
        // Optional authentication: identify sender if token is provided
        if (req?.headers?.authorization) {
            const { user, decoded } = await decodedToken({ token: req.headers.authorization, tokenType: tokenTypeEnum.Access });
            req.user = user;
            req.decoded = decoded;
        }
        next();
    }),
    localFileUpload({
        validation: fileFaildValifation.image,
        customPath: "Messages",
        maxSize: 1
    }).array("attachments", 2),
    validation(validators.sendMessage),
    asyncHandler(async (req, res, next) => {
        if (!req.body?.content && !req.files?.length) {
            throw BadRequestError({
                message: "Please provide message content or at least one attachment.",
            })
        }
        const message = await sendMessage(req.params.receiverId, req.body, req.files, req.user)
        const responseData = (message && typeof message.toObject === 'function') ? message.toObject() : message;
        return successResponse({ res, message: "Your message has been sent successfully!", data: { message: responseData } })
    }))

/**
 * Endpoint to list all messages (Inbound and Outbound) for the authenticated user.
 */
messageRouter.get('/list',
    authentcationMiddleWare(),
    asyncHandler(async (req, res, next) => {
        const messages = await getAllMessage(req.user)
        return successResponse({ res, message: "Your messages have been retrieved successfully.", statusCode: 200, data: { messages } })
    }))

/**
 * Endpoint to retrieve a single message by ID.
 */
messageRouter.get('/:messageId',
    authentcationMiddleWare(),
    validation(validators.getMessage),
    asyncHandler(async (req, res, next) => {
        const message = await getMessage(req.params.messageId, req.user)
        return successResponse({ res, message: "Message details retrieved successfully.", statusCode: 200, data: { message } })
    }))

/**
 * Endpoint to delete a message by ID.
 */
messageRouter.delete('/:messageId',
    authentcationMiddleWare(),
    validation(validators.getMessage),
    asyncHandler(async (req, res, next) => {
        const message = await deleteMessage(req.params.messageId, req.user)
        return successResponse({ res, message: "The message has been deleted successfully.", statusCode: 200, data: { message } })
    }))

export default messageRouter;