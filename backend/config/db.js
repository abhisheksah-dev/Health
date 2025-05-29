import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config();

const connecctDB = async () =>{
    try {
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected");
        
    } catch (error) {
        console.error("Mongo Error",error.message);
        process.exit(1);
    }
}

export default connecctDB;