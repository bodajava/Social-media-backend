import mongoose from 'mongoose';

const dbUrl = "mongodb+srv://bodajava:bodajava1@cluster0.bclwbyj.mongodb.net/SARAHA-APP";

async function testConnection() {
    console.log("Attempting to connect to MongoDB Atlas...");
    try {
        await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout
        });
        console.log("SUCCESS: MongoDB is working and connected correctly!");
        process.exit(0);
    } catch (error) {
        console.error("ERROR: Failed to connect to MongoDB.");
        console.error(error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
