import dotenv from 'dotenv'
dotenv.config();
import mongoose from 'mongoose'

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