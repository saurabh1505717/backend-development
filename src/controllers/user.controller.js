import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //1. get user details from frontend like name email password, photo, etc
  //2. add validation like, email or username is received empty or not, the format of email is correct or not
  //3. check if user already exists: check with username and email
  //4. check for images, check for avatar
  //5. upload them to cloudinary, check for avatar upload
  //6. create user object - create entry in mongo db
  //7. remove password and refresh token field from response
  //8. check for user creation
  //9. return response if user created or send error if user not created

  // 1:
  const { fullName, email, username, password } = req.body || {};
  //   console.log("full name: ", fullName);

  // 2:

  // if we do like this, then we have to check for all the fields having multiple ifs

  // if(fullName === ""){
  //     throw new ApiError(400, "fullname is required");
  // }

  // Better approach
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3:
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //   console.log(req.files);

  // 4:
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 5:
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    return new ApiError(400, "Avatar file is required");
  }

  // 6:
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // followed step 7 here using select method and passing the string inside it : "-password -refreshToken"
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8.
  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 9:
  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User registered Successfully!"));
});

export { registerUser };
