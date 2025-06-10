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
        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const admin = await Admin.create({
            userName,
            password: hashedPassword,
            role,           
        })
        // 🧠 send a success response, include token in response
        return res.status(201).json(
            new ApiResponse(201, {
             _id: admin._id,
            userName: admin.userName,
            password: admin.password,
            role: admin.role,
            token: generateToken(admin._id),
            }, 'New admin created successfully'));


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
const loginAdmin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body

  // Check for admin userName
  const admin = await Admin.findOne({ userName })

  if (admin && (await bcrypt.compare(password, admin.password))) {
    res.json({
      _id: admin.id,
      userName: admin.userName,
      token: generateToken(admin._id),
    })
  } else {
    res.status(400)
    throw new Error('Invalid credentials')
  }
})

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}

export { addAdmin, updateAdmin, deleteAdmin, getAdmin, loginAdmin };