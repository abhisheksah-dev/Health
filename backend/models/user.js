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
},{timestamps:true});
const User = mongoose.model("User",userSchema);
export default User;