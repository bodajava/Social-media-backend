import { createClient } from "redis"

export const redisClient = createClient({
    url: process.env.REDIS_URI
})

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

export const connectRedis = async () => {
    try {
        await redisClient.connect()
        console.log(`\x1b[32m✔ Databases connected: REDIS DATABASE\x1b[0m`);

    } catch (error) {
        console.error(`\x1b[31m✖ Failed to connect to REDIS DATABASE: ${error.message}\x1b[0m`);

    }
}