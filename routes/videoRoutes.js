/**
 * videoRoutes.js
 * This module provides routes for video-related operations.
 */

// Importing necessary modules
import {Router} from "express";
import multer from 'multer';
import { verifySuperAdmin, updateLastRequest } from "../customModules/superadmin.js";
import {addVideo, deleteVideoWithUpdate} from "../customModules/video.js";
import {deleteMultipleVideosWithUpdates} from "../customModules/video.js";
import {ObjectId} from "mongodb";
import mongoClient, {contentDb} from "../dbSetup.js";

// Initializing express router
const videoRouter = Router();

// Setting up multer for file uploads
// Files will be stored in memory
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

/**
 * Route for creating a video
 * This route is protected by superadmin verification middleware
 * It also updates the last request of the superadmin
 * It accepts a single file upload with the field name 'video'
 */
videoRouter.post('/create', verifySuperAdmin, updateLastRequest, upload.single('video'), async (req, res) => {
    // Constructing video details from request body and file
    const videoDetails = {
        title: req.body.title,
        description: req.body.description,
        content: req.file,
        sortingIndex: req.body.sortingIndex
    }

    try {
        // Attempt to create the video
        const createdVideo = await addVideo(req.body.moduleId, videoDetails);
        // If video creation failed, send an error response
        if (createdVideo === [] || createdVideo === null || createdVideo === undefined) {
            return res.status(400).json({message: "Video Not created, Server Error."});
        }

        // If video creation was successful, send the created video
        return res.status(200).json(createdVideo)

    } catch (e) {
        // Handle errors
        if (e.message === "Video details are missing.") {
            return res.status(400).json({message: "Video details are missing."});
        }

        console.log('Error in POST Router /create', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

/**
 * Route for deleting a single video
 * This route is protected by superadmin verification middleware
 * It also updates the last request of the superadmin
 */
videoRouter.get('/delete/one',verifySuperAdmin, updateLastRequest, (req, res) => {
    const videoId = req.body.videoId
    if (videoId === null || videoId === undefined || videoId === "") {
        return res.status(400).json({message: "Video ID is missing."});
    }

    const isDeleted = deleteVideoWithUpdate(videoId);
    if (isDeleted === false) {
        return res.status(400).json({message: "Video Not Deleted, Server Error."});
    } else {
        return res.status(200).json({message: "Video Deleted."});
    }
})

/**
 * Route for deleting multiple videos
 * This route is protected by superadmin verification middleware
 * It also updates the last request of the superadmin
 */
videoRouter.get('/delete/multiple',verifySuperAdmin, updateLastRequest, async (req, res) => {
    const videoIds = req.body.videoIds

    if (videoIds === null || videoIds === undefined || videoIds === "")
        return res.status(400).json({message: "Video IDs are missing."});

    try {
        await deleteMultipleVideosWithUpdates(videoIds);
    } catch (e) {
        console.log('Error in POST Router /delete/multiple', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

// Exporting the router
export default videoRouter;