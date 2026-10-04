import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const owner = req.user?._id;
  if (!owner) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const playlists = await Playlist.find({
    owner: userId,
  }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const userId = req.user?._id;

  // 1. Check Authentication
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  // 2. Validate IDs
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Inavlid playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  // 3. Find playlist
  const playlist = await Playlist.findBydId(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 4. Check playlist ownership
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  // 5. Check if video already exists in the playlist
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in the playlist");
  }

  // 6. Add video to playlist
  playlist.videos.push(videoId);

  // 7. Save playlist
  await playlist.save();

  // 8. Return the updated playist
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to the playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, "Videos not found in playlist");
  }

  // remove playlist - way 1

  // playlist.videos = playlist.videos.filter(
  //     (id) => id.toString() !== videoId
  // );

  // await playlist.save();

  // WAY - 2
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
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
        updatedPlaylist,
        "Video removed from the playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  // Delete playlist
  await Playlist.findByIdAndDelete(playlistId);

  return res
    .ststus(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update tis playlist");
  }

  if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name.trim(),
        description: description?.trim() || "",
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
