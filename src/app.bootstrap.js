import express from 'express'
import { userRouter, authRouter } from './Module/index.js';
import { connectDB, connectRedis, redisClient } from './db/index.js';
import { globalErrorHandler } from './common/utils/index.js';
import cors from 'cors'
import { resolve } from 'node:path';
import messageRouter from './Module/message/message.controller.js';
import helmet from 'helmet'

/**
 * Bootstrap Application - Configures Express, Middleware, Database connections, and Routes.
 */
export const bootstrap = async () => {
    const app = express()
    const port = parseInt(process.env.PORT) || 3000

    // Security and Performance Middleware
    app.set('trust proxy', true)
    app.use(helmet())
    app.use(cors({
        origin: "*", // Adjust this to specific domains for production security
        credentials: true
    }))
    app.use(express.json())

    // Database Connections
    await connectRedis()
    await connectDB()

    // Static Files and Routes
    app.use('/upload', express.static(resolve('../upload')))
    app.use('/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/message', messageRouter)

    // Root Welcome Route for connectivity testing
    app.get('/', (req, res) => {
        return res.status(200).json({
            message: "Welcome to Saraha API! Server is online and database is connected.",
            status: "success"
        });
    });

    // Global Error Handling
    app.use(globalErrorHandler)

    // 404 Handler
    app.use((req, res) => {
        return res.status(404).json({ message: "The requested resource could not be found." })
    })

    // Start Server
    app.listen(port, () => {
        console.log(`\x1b[32m✔ Server is running on port ${port}\x1b[0m`);
    })
}
