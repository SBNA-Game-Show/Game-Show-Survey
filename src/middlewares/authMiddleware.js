import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { Admin } from "../models/admin.model.js";



export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {

        //This will get the token
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        //Unauthorized if there is no token
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        //Check/verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        //Will fetch the admin
        const admin = await Admin.findById(decodedToken?._id).select("-password -refreshToken")
        
        //Invalid access token if there is no admin
        if (!admin) {          
            throw new ApiError(401, "Invalid Access Token")
        }


        //If both token and admin are valid, it will attach admin to request
        req.admin = admin;
        next()
    //Error handling for token missing, invalids, admin not found and other 
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})

