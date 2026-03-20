import { createClient } from "redis"

export const redisClient = createClient({
    url: process.env.REDIS_URI
})

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

export const connectRedis = async () => {
    try {
        await redisClient.connect()
        console.log(`datta bases connected REDIS DATABASAE `);

    } catch (error) {
        console.log(`faild to connect REDIS DATABASAE  ${error}`);

    }
}