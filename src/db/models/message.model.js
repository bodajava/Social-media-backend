import mongoose from "mongoose";



const messageschema = new mongoose.Schema({
    content: {
        type: String,
        minlength: 2,
        maxlength: 100000,
        required: function () {
            return !this.attachments?.length
        }
    },
    attachments: {
        type: [String],
        default: []
    },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
    collection: "message",
    timestamps: true
})

export const messageModel = mongoose.models.message || mongoose.model("message", messageschema)