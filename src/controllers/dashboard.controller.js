import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRespinse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get the channel stats like total video views, likes, total subscribers, total videos, total likes, etc.
const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user?._id;

  if (!channelId) {
    throw new ApiError(401, "Unauthorized request");
  }

  // Get total video and total views
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: channelId,
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalVideos = videoStats[0]?.totalVideos || 0;
  const totalViews = videoStats[0]?.totalViews || 0;

  // Get total Subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  // Get all video owned by this channel
  const channelVideos = await Video.find({
    owner: channelId,
  }).select("_id");

  const videoIds = channelVideos.map((video) => video._id);

  // Get total likes on those videos
  const totalLikes = await Like.countDocuments({
    video: { $in: videoIds },
  });

  const stats = {
    totalVideos,
    totalViews,
    totalSubscribers,
    totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

// To get all the videos uploaded by this channel
const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user?._id;

  if (!channelId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const videos = await Video.find({
    owner: channelId,
  }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
