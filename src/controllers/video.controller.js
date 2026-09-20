import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// To get all the videos for home page/feed
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const pipeline = [];

  // Only published videos
  pipeline.push({
    $match: {
      isPunlished: true,
    },
  });

  // Get owner/channel information
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
    },
  });

  // Search in video title, description or channel name
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          {
            title: {
              $regex: query,
              $options: "i",
            },
          },
          {
            descripton: {
              $regex: query,
              $options: "i",
            },
          },
          {
            "owner.username": {
              $regex: query,
              $options: "i",
            },
          },
        ],
      },
    });
  }

  // Sort
  pipeline.push({
    $sort: {
      [sortBy]: sortType === "asc" ? 1 : -1,
    },
  });

  const options = {
    page: Number(page),
    limit: Number(limit),
  };

  const videos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// To publish a video
const publishAVideo = asyncHandler(async (req, res) => {
  // 1. Get the text data from request body
  const { title, description, isPublished } = req.body;

  // 2. Get uploaded files from multer
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  // 3. Validate required data
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is missing");
  }

  // 4. Upload video to cloudinary
  const video = await uploadOnCloudinary(videoLocalPath);

  // 5. Upload thumbnail to Cloudinary
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // 6. Check whether Cloudinary uploads were successful
  if (!video) {
    throw new ApiError(500, "Video upload failed");
  }

  if (!thumbnail) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  // 7. Create video document in MongoDB
  const video = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: video.duration,
    isPublished,
    owner: req.user._id,
  });

  // 8. return the created video
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

export { getAllVideos, publishAVideo };
