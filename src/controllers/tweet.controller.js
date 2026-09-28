import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";

// To create a tweet
const createTweet = asyncHandler(async(req, res) => {
    const { content } = req.body;

    const owner = req.user?._id;
    if(!owner){
        throw new ApiError(401, "Unauthorized request");
    }

    if(!content?.trim()){
        throw new ApiError(400, "Tweet contemt is required");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, tweet, "Tweet created successfully"
        )
    );
});

// To get user tweets
const getUserTweets = asyncHandler(async(req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID");
    }

    const tweet = await Tweet.find({
        owner: userId
    }).sort({
        createdAt: -1
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            2000, tweets, "User tweets fetched successfully"
        )
    );
});

// To update a tweet
const updateTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID");
    }

    if(!content?.trim()){
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId, {
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
            200, updateTweet, "Tweet updated successfully"
        )
    );
});

// To delete a tweet
const deleteTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params;
    
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.finById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}