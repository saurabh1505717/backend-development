import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    const userId = req.user?._id;

    // 1. Check authentication
    if(!userId){
        throw new ApiError(401, "Unauthorized request");
    }

    // 2. Validate video ID
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    // 3. Check whether video exists
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    // 4. Check whether user already liked the video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    // 5. If already liked, remove the like
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(new ApiResponse(
            200, {liked:false}, "Video unliked successfully"
        ));
    }

    // 6. Otherwise, create a like
    await Like.create({
        video: videoId,
        likedBy: userId
    });

    return res.status(200).json(
        new ApiResponse(
            200, {liked: true}, "Video liked successfully"
        )
    );
});

const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params; 
    const userId = req.user?._id;

    if(!userId){
        throw new ApiError(401, "Unauthorized request");
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(new ApiResponse(
            200, {liked: false}, "Comment unliked successfully"
        ));
    }

    await Like.create({
        comment: commentId,
        likedBy: userId
    });

    return res.status(200).json(
        new ApiResponse(
            200, {liked: true},  "Comment liked successfully"
        )
    );
});

const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;
    const userId = req.user?._id;

    if(!userId){
        throw new ApiError(401, "Unauthorized request");
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }
    
    const existingTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if(existingTweet){
        await Like.findByIdAndDelete(existingTweet._id);

        return res.status(200).json(
            new ApiResponse(
                200, {liked: false}, "Tweet unliked successfully"
            )
        );
    }

    await Like.create({
        tweet: tweetId,
        likedBy: userId
    });

    return res.status(200).json(
        new ApiResponse(
            200, {liked: true}, "Tweet liked successfully"
        )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    if(!userId){
        throw new ApiError(401, "Unauthorized request");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: userId,
                video: {$ne: null}
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $replaceRoot: {
                newRoot: "$video"
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200, likedVideos, "Liked Videos fetched successfully"
        )
    );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}