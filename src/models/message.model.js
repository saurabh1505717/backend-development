import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        seenAt: {
            type: Date,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        }
    },{
        timestamps: true
    }
);

export const Message = mongoose.model("Message", messageSchema);