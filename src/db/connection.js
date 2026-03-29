import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose'
import { userModel } from './models/user.model.js';

dotenv.config({ path: path.resolve('config', '.env') });

export const connectDB = async () => {
    try {
        if (!process.env.DB_URL) {
            throw new Error("DB_URL is not defined in environment variables. Check your config/.env file.");
        }
        await mongoose.connect(process.env.DB_URL, { serverSelectionTimeoutMS: 3000 })
        console.log("\x1b[32m✔ Database connection successful\x1b[0m");
        await userModel.syncIndexes()
    } catch (error) {
        console.error(`\x1b[31m✖ Failed to connect to the database: ${error.message}\x1b[0m`);
    }
}