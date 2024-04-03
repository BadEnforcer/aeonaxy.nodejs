import express from 'express';

const expressApp = express();
const port = process.env.PORT || 8080;

expressApp.use(express.json());


// ? REGION Routes
import userAPIRouter from "./routes/user.js";
expressApp.use('/api/user', userAPIRouter)

import courseRouter from "./routes/courseRoutes.js";
expressApp.use('/api/course', courseRouter)

import moduleRouter from "./routes/moduleRoutes.js";
expressApp.use('/api/module', moduleRouter)

import videoRoutes from "./routes/videoRoutes.js";
expressApp.use('/api/video', videoRoutes)

// ! webhooks
import resendWebhooksRouter from "./routes/resendWebhooks.js";
expressApp.use('/webhooks', resendWebhooksRouter)

// ? REGION Routes

async function startServer() {
    try {
        await expressApp.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
    } catch (err) {
        console.error(err)
    }
}

await startServer()