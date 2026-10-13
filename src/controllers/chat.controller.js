import mongoose, {isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createMessageRequest = asyncHandler(async(req, res) => {
    const senderId = req.user?._id;
    const {recipientId, content} = req.body;

    // 1. Check authentication 
    if(!senderId){
        throw new ApiError(401, "Unauthorized request");
    }

    // 2. Validate recipient ID
    if(!isValidObjectId(recipientId)){
        throw new ApiError(400, "Invalid recipient Id");
    }

    // 3. Prevent messaging yourself
    if(senderId.toString() === recipientId.toString()){
        throw new ApiError(400, "You cannot message yourself");
    }

    // 4. Validate message content
    if(typeof content !== "string" || !content.trim()){
        throw new ApiError(400, "Message content is required");
    }

    // 5. Check recipient exists
    const recipient = await User.findById(recipientId);

    if(!recipient){
        throw new ApiError(404, "Recipient not found");
    }

    // 6. Check existing conversation
    const existingCoversation = await Conversation.findOne({
        participants: { $all: [senderId, recipientId] }
    });

    if(existingCoversation){
        if(existingCoversation.status === "pending"){
            throw new ApiError(409, "A conversation request already exists between these users");
        }

        if(existingCoversation.status === "declined"){
            throw new ApiError(403, "This conversation request was declined");
        }

        if(existingCoversation.status === "accepted"){
            throw new ApiError(409, "A conversation already exists. Send a regular message instead");
        }
    }

    // 7. Create the conversation request
    const conversation = await Conversation.create({
        participants: [senderId, recipientId],
        requestedBy: senderId,
        status: "pending"
    });

    // 8. Save the intial message
    const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        content: content.trim()
    });

    // 9. Return response 
    return res.status(201).json(
        new ApiRespinse(
            201, 
            {conversation, message},
            "Message request sent successfully"
        )
    );
});

export {
    createMessageRequest
}