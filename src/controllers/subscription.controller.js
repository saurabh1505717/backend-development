import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";

// To toggle the subscription
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriberId = req.user?._id;

  if (!subscriberId) {
    throw new ApiError(401, "Unauthorized request");
  }

  if(!isValidObjectId(channelId)){
    throw new ApiError(400, "Invalid channel ID");
  }

  // Check if Subscription already exists
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    // Already subscribed -> unsubscribe
    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res.status(200);
    json(
      new ApiResponse(
        200,
        { subscribed: false },
        "Channel unsubscribed successfully"
      )
    );
  }

  // Not Subscribed -> subscribe
  await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribed: true },
        "Channel subscribed successfully"
      )
    );
});

// To return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subascriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: "$subscriber._id",
          username: "$subscriber.username",
          fullName: "$subscriber.fullName",
          avatar: "$subscriber.avatar",
        },
      },
    },
  ]);

  return res.status.json(
    new ApiResponse(200, subscribers, "Subscrbers fetched successfully")
  );
});

// To return channel list to which user has subcribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        _id: 0,
        channel: {
          _id: "$channel._id",
          username: "$channel.username",
          fullName: "$channel.fullName",
          avatar: "$channel.avatar",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
