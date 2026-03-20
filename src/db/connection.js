import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose'
import { userModel } from './models/user.model.js';

dotenv.config({ path: path.resolve('config', '.env') });

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 3000 })
        console.log("database connection successful");
        await userModel.syncIndexes()
    } catch (error) {
        console.log(`failed to connect the database ${error}`);

    }
}