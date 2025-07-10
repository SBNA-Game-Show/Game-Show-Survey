import mongoose, { Schema } from "mongoose";
import { USER_ROLE } from "../constants.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new Schema(
    {
        userName: { type: String, required: true, trim: true},
        password: { type: String, required: true, trim: true},
        role: { 
            type: String, 
            enum: Object.values(USER_ROLE),
            required: true
        },
        refreshToken: {
            type: String
        }
    },{ collection: 'fixed_admin' });

//check if password was modified, 
// if yes, it will hash the password using bcrypt with salt round 10, 
// if not, it skips hashing
//Ensures that passwords are always securely hashed before saving, preventing plain text passwords in the DB

adminSchema.pre("save", async function (next) {
    if(!this.isModified("password"))  return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


//compares the input password vs hashed (already stored) password

adminSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


//Authenticate admin temporarily

adminSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//To get another token (refresh) when the old (access) one expires (Without relogin)

adminSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const Admin = mongoose.model("Admin", adminSchema);