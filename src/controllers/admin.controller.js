import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Admin } from "../models/admin.model.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// [ POST ] add a new admin
const addAdmin = asyncHandler(async (req, res) => {

    // check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    // get info from request body
    const { userName, password, role } = req.body;

    // check for missing fields
    if (!userName || !password || !role) {
        throw new ApiError(400, "All fields are required for creating an admin");
    }

    // check if userName is already in use
    const alreadyExists = await Admin.findOne(
        {'userName': userName}
    );

    // add the new administrator to the database if it doesn't already exist
    if (!alreadyExists) {
        
        const admin = await Admin.create({
            userName,
            password,
            role,           
        })

        //fetch the Admin
        //the .selec means it should exclude the password and refreshToken

        const createdAdmin = await Admin.findById(admin._id)
        // .select(
        // "-password -refreshToken"
        // )

        if (!createdAdmin) {
        throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
        new ApiResponse(200, createdAdmin, "New Admin created successfully")
    );
    
        // // 🧠 send a success response, include token in response
        // return res.status(201).json(
        //     new ApiResponse(201, {
        //      _id: admin._id,
        //     userName: admin.userName,
        //     password: admin.password,
        //     role: admin.role,
        //     token: generateToken(admin._id),
        //     }, 'New admin created successfully'));


        // send a success response
        // return res.status(201).json(new ApiResponse(201, admin, "New admin created successfully"));

    } else { // if the admin already exists, send an error repsonse (use apiError or apiResponse??)
        return res.status(400).json(new ApiError(400, "Cannot create new admin because username or email already exists"));
    }
});

// [ PUT ] update an existing admin
const updateAdmin = asyncHandler(async (req, res) => {

    // check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    // get info from request body
    const { userName, newUserName, newPassword, newRole } = req.body;

    // check for missing/empty fields
    if (!userName || !newUserName || !newPassword || !newRole) {
      throw new ApiError(400, "All fields are required for creating an admin");
    }

    // find and update the admin
    const filter = { 'userName': userName };
    const update = {
        'userName': newUserName,
        'password': newPassword,
        'role': newRole
    };

    const admin = await Admin.findOneAndUpdate(filter, update);

    // check if update was successful and send response
    if (!admin) {
        // send an error response
        return res.status(400).json(new ApiError(400, "Error updating admin"));

    } else {
        // send a success response
        return res.status(201).json(new ApiResponse(201, admin, "Admin updated successfully"));
    }

});

// [ DELETE ] delete an admin
const deleteAdmin = asyncHandler(async (req, res) => {

    // check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    // get info from request body (what do we need to delete admin...)
    const { userName } = req.body;

    // find and delete the admin
    const admin = await Admin.deleteOne({
        'userName': userName
    });

    // check if delete was successful and send response
    if (!admin) {
        // send an error response
        return res.status(201).json(new ApiError(201, "Error deleting admin"));

    } else {
        // send a success response
        return res.status(201).json(new ApiResponse(201, admin, "Admin deleted successfully"));
    }

});

// [ GET ] get the information for an admin
const getAdmin = asyncHandler(async (req, res) => {

    // check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    // get info from request body
    const { userName } = req.body;

    // find the admin based on username (change to some other id?)
    const admin = await Admin.findOne({
        'userName': userName
    });

    // check if admin was found and send response
    if (!admin) {
        // send an error response
        return res.status(400).json(new ApiError(400, "Error finding admin"));

    } else {
        // send a success response
        return res.status(201).json(new ApiResponse(201, admin, "Admin found successfully"));
    } 

})

// @desc    Authenticate an admin
// @route   POST /api/admin/login
// @access  Private
// const loginAdmin = asyncHandler(async (req, res) => {
//   const { userName, password } = req.body

//   // Check for admin userName
//   const admin = await Admin.findOne({ userName })

//   if (admin && (await bcrypt.compare(password, admin.password))) {
//     res.json({
//       _id: admin.id,
//       userName: admin.userName,
//       refreh
//     })
//   } else {
//     res.status(400)
//     throw new Error('Invalid credentials')
//   }
// })

// req body -> data
// userName or password
//find the admin
//password check
//access and referesh token
//send cookie

const loginAdmin = asyncHandler(async (req, res) =>{

    // check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    const {userName, password} = req.body

    if (!userName && !password) {
        throw new ApiError(400, "userName password is required")
    }

    const admin = await Admin.findOne({
        $or: [{userName}, {password}]
    })

    if (!admin) {
        throw new ApiError(404, "Admin does not exist")
    }

   const isPasswordValid = await admin.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid admin credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(admin._id)

    const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

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

const logoutAdmin = asyncHandler(async(req, res) => {

    // check if admin
    if (!req.isAdminRoute) {
        throw new ApiError(403, "You need Admin Privileges");
    }

    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
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

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged Out"))
})

const generateAccessAndRefereshTokens = async(_id) =>{
    try {
        const admin = await Admin.findById(_id)
        const accessToken = admin.generateAccessToken()
        const refreshToken = admin.generateRefreshToken()

        admin.refreshToken = refreshToken
        await admin.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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







export { addAdmin, updateAdmin, deleteAdmin, getAdmin, loginAdmin, logoutAdmin, refreshAccessToken };