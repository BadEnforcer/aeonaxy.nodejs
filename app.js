/**
 * @fileoverview Main server file for the application.
 */

// Importing required modules
import express from 'express';
import session from 'express-session';
import cookieParser from "cookie-parser";

// Setting up express app and port
const expressApp = express();
const port = process.env.PORT || 8080;

// Setting up middleware
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
expressApp.use(cookieParser());

// Importing and setting up routes
import userAPIRouter from "./routes/user.js";
expressApp.use('/api/user', userAPIRouter)

import courseRouter from "./routes/courseRoutes.js";
expressApp.use('/api/course', courseRouter)

import moduleRouter from "./routes/moduleRoutes.js";
expressApp.use('/api/module', moduleRouter)

import videoRoutes from "./routes/videoRoutes.js";
expressApp.use('/api/video', videoRoutes)

import superAdminRouter from './routes/superadmin.js';
expressApp.use('/superadmin', superAdminRouter)

import searchRouter from './routes/searchRoutes.js';
expressApp.use('/search', searchRouter)

// Importing and setting up webhooks
import resendWebhooksRouter from "./routes/resendWebhooks.js";
expressApp.use('/webhooks', resendWebhooksRouter)

/**
 * Function to start the server.
 */
async function startServer() {
    try {
        await expressApp.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
    } catch (err) {
        console.error(err)
    }
}

// Starting the server
await startServer()