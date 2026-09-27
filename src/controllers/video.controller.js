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

// To get a Video by ID ( used for fetching a video through video url )
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
  ]);

  if (!video.length) {
    throw new ApirError(404, "Video no found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      video[0], // aggregate() always returns an array, therefore video[0]
      "Video fetched successfully"
    )
  );
});

// To update video details like title, description, thumbnail
const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // Below we do findByIdAndUpdate, still we need this bcz We need to know who owns the video before allowing the update.
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Make sure the logged-in user owns this video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to update the video details for this video"
    );
  }

  // update text fields
  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = descripton;
  }

  // if a new thumbnail was uploaded
  if (req.file?.path) {
    const thumbnail = await uploadOnCloudinary(req.file.path);

    if (!thumbnail?.url) {
      throw new ApiError(500, "Error while uploading thumbnail");
    }

    video.thumbnail = thumbnail.url;
  }

  // update changes
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        descripton,
        thumbnail: thrumbnailUrl,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

// To delete a video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!videoId) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to change the video publish status"
    );
  }

  const updatedVideoStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideoStatus,
        "Publish status of the video chnaged successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideoDetails,
  deleteVideo,
  togglePublishStatus
};
