import e from "express";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        min:2,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        min:5,
        lowercase:true,
        trim:true,
    },
    password:{
        type:String,
        required:true,
        min:3,
        trim:true,
    },
    refreshToken:{
        type:String,
        default:null,
    },
    phone: {
        type: String,
        trim: true,
        minlength: 7,
        maxlength: 15,
    },
    role:{
        type:String,
        enum:["user","admin","doctor"],
        default:"user",
    },
    profile:{
        gender:{
            type:String,
            enum:["male","female"],
            default:"male",
        },
        dob:Date,
        address:{
            type:String,
            trim:true,
        },
        
        bloodGroup:{
            type:String,
            enum:["A+","A-","B+","B-","AB+","AB-","O+","O-"],
            default:"O+",
        },

    }
},{timestamps:true});
const User = mongoose.model("User",userSchema);
export default User;