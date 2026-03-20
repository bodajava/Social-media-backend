import { messageModel } from "../../db/models/message.model.js";
import { findOne, find, createOne, userModel, findByIdAndDelete, findOneAndDelete } from "../../db/index.js";
import { NotFoundError } from "../../common/utils/res/error.res.js";

/**
 * Sends a message to a receiver, optionally with attachments and sender info.
 * @param {string} receiverId - ID of the message recipient.
 * @param {Object} body - Includes message content.
 * @param {Array} files - Array of uploaded attachment files.
 * @param {Object} user - The authenticated sender (optional).
 * @returns {Object} The created message document.
 */
export const sendMessage = async (receiverId, { content } = {}, files = [], user) => {
    const account = await findOne({
        model: userModel,
        filter: { _id: receiverId, confirmEmail: true }
    })

    if (!account) {
        throw new NotFoundError({ message: "The recipient account was not found or is currently inactive." })
    }

    const message = await createOne({
        model: messageModel,
        data: {
            content,
            attachments: files.map((file) => file.finalpath),
            receiverId,
            senderId: user ? user._id : undefined
        }
    })

    return message
}

/**
 * Retrieves a specific message by ID, ensuring the user is either the sender or receiver.
 * @param {string} messageId - ID of the message to retrieve.
 * @param {Object} user - The authenticated user.
 * @returns {Object} The message document.
 */
export const getMessage = async (messageId, user) => {
    const message = await findOne({
        model: messageModel,
        filter: {
            _id: messageId,
            $or: [{ senderId: user._id }, { receiverId: user._id }]
        },
        select: "-senderId"
    })

    if (!message) {
        throw new NotFoundError({ message: "Message not found or you do not have permission to view it." })
    }

    return message
}

/**
 * Retrieves all messages associated with the authenticated user (Sent or Received).
 * @param {Object} user - The authenticated user.
 * @returns {Array} List of message documents.
 */
export const getAllMessage = async (user) => {
    return await find({
        model: messageModel,
        filter: {
            $or: [{ senderId: user._id }, { receiverId: user._id }]
        },
        select: "-senderId"
    })
}

/**
 * Deletes a message by ID, ensuring the user is authorized.
 * @param {string} messageId - ID of the message to delete.
 * @param {Object} user - The authenticated user.
 * @returns {Object} The deleted message document.
 */
export const deleteMessage = async (messageId, user) => {
    const message = await findOneAndDelete({
        model: messageModel,
        filter: {
            _id: messageId,
            $or: [{ senderId: user._id }, { receiverId: user._id }]
        },
        select: "-senderId"
    })

    if (!message) {
        throw new NotFoundError({ message: "Message not found or you are not authorized to delete it." })
    }

    return message
}