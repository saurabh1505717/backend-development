import mongoose, {isValidObjectId} from "mongoose";
import {Commment} from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },{
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },{
            $unwind: "$owner"
        },{
            $project: {
                content: 1,
                createdAt: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                }
            }
        },{
            $sort: {
                createdAt: -1
            }
        }
    ];

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),{
            page: Number(page),
            limit: Number(limit)
        }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, comments, "Videp cpmments fetched successfully"
        )
    );
});

const addComment = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    const owner = req.user?._id;

    if(!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    if(!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, comment, "Comment added successfully"
        )
    );
});

const updateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID");
    }

    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);
    
    if(!comment){
        throw new ApiError(400, "Comment not found");
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId, {
            $set: {
                content: content.trim()
            }
        },{
            new: true
        }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, updatedComment, "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    // 1.Validate comment ID
    if(!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // 2. find the comment
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    // 3. Check ownership
    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(
            403, "You are not authrozied to delete this comment"
        );
    } 

    // 4. Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // 5. send response
    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}