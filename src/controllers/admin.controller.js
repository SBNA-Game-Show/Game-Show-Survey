import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Admin } from "../models/admin.model.js";

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
            role
        });

        // send a success response
        return res.status(201).json(new ApiResponse(201, admin, "New admin created successfully"));

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

export { addAdmin, updateAdmin, deleteAdmin, getAdmin };