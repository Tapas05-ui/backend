import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler ( async (req, res) => {
    
    const {username, email, fullName, password} = req.body;
    console.log("userName : ", username);

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
    const existUser = User.findOne({
        $or: [{ username}, { email }]
    });

    if(existUser){
        throw new ApiError(409, "User with email or username Already exists")
    }

    // CHECK FOR AVATAR AND COVERIMAGE
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser }
