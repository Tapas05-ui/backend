import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler ( async (req, res) => {
    
    const {username, email, fullName, password} = req.body;
    //console.log("userName : ", username);

    // if(username === ""){
    //     throw new ApiError(400, "Field must be required");
    // }

    // VALIDATION - NOT EMPTY
    if (
        [username, email, fullName, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "Field must be required");
    }

    // CHECK USER ALREADY EXISTS 
    const existUser = await User.findOne({
        $or: [{ username}, { email }]
    });

    if(existUser){
        throw new ApiError(409, "User with email or username Already exists")
    }

    // CHECK FOR AVATAR AND COVERIMAGE
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "avater file is required");
    }

    // UPLOAD THEM TO CLOUDINARY 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "avater file is required");
    }

    // CREATE USER OBJECT IN DATABASE
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    // REMOVE PASSWORD AND REFRESHTOKEN
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // CHECK FOR USER CREATION
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while register the user");
    }

    // RETURN RESPONSE
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Register Successfully")
    )
})

const loginUser = asyncHandler (async (req, res) => {
    // req body -> data
    const {username, email, password} = req.body;

    // username or email
    if(!username || !email) {
        throw new ApiError(400, "username or email is required")
    }
    // find user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exist")
    }
    // check password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "password incorrect")
    }
    // access and fresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    // send cookies
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler (async(req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged out"))
})

export { registerUser, loginUser, logoutUser }
