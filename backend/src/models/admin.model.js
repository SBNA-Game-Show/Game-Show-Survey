import mongoose, { Schema } from "mongoose";
import { USER_ROLE } from "../constants.js";

const adminSchema = new Schema(
    {
        userName: { type: String, required: true, trim: true},
        password: { type: String, required: true, trim: true},
        role: { 
            type: String, 
            enum: Object.values(USER_ROLE),
            required: true
        },
    }
)