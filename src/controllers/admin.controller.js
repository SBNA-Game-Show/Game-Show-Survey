import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Admin } from "../models/admin.model.js";
import jwt from 'jsonwebtoken';


//Login using userName and password (Hashed) while storing the access and refresh token into a cookie
const loginAdmin = asyncHandler(async (req, res) =>{

    //Check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    //Get the userName and Password
    const {userName, password} = req.body
    
    //Find the userName and password, while putting them to admin
    const admin = await Admin.findOne({
        $or: [{userName}, {password}]
    })

    //If both userName and password are wrong, then throw Api Error
    if (!admin) {
        throw new ApiError(404, "Admin does not exist")
    }

    //Password Check
    const isPasswordValid = await admin.isPasswordCorrect(password)

    if (!isPasswordValid) {
    throw new ApiError(401, "Invalid admin credentials")
    }

    //access and referesh token
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(admin._id)

    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    //send cookie
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                admin: loggedInAdmin, accessToken, refreshToken
            },
            "Admin logged In Successfully"
        )
    )

})

//Logout using _id, where it will also clear the cookie that we stored with access and refresh token
const logoutAdmin = asyncHandler(async(req, res) => {

    //Check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    //Find the _id
    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $unset: {
                refreshToken: 1 //This removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    //Clears the cookie
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged Out"))
})

//It generates and return the access/refresh token for an admin user. 
const generateAccessAndRefereshTokens = async(_id) =>{
    try {

        //Find the mongo _id
        const admin = await Admin.findById(_id)

        //Return the JWTs
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()

        //Save the new refresh token where it will skips validatation before saving
        admin.refreshToken = refreshToken
        await admin.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

//It authorize the user if refresh token correct
//It makes sure if the refresh token is expired or used
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const admin = await Admin.findById(decodedToken?._id)
    
        if (!admin) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== admin?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(admin._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export { loginAdmin, logoutAdmin, refreshAccessToken };