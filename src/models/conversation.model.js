import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
        ],
        requestedBy: {
            type: Schema.Types.ObjectId,
            ref: "User", 
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending"
        }
    },{
        timestamps: true
    }
);

export const Conversation = mongoose.model("Conversation",
    conversationSchema
);