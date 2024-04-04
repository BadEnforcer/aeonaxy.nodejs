import {Router} from "express";

const videoRouter = Router();

// ? import multer for file uploads
import multer from 'multer'
// ! Setup Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({storage: storage});


import {addVideo, deleteVideoWithUpdate} from "../customModules/video.js";
import {ObjectId} from "mongodb";
import mongoClient, {contentDb} from "../dbSetup.js";

videoRouter.post('/create', upload.single('video'), async (req, res) => { // WORKS!!
    const videoDetails = {
        title: req.body.title,
        description: req.body.description,
        content: req.file,
        sortingIndex: req.body.sortingIndex
    }

    try {
        const createdVideo = await addVideo(req.body.moduleId, videoDetails);
        if (createdVideo === [] || createdVideo === null || createdVideo === undefined) {
            return res.status(400).json({message: "Video Not created, Server Error."});
        }

        return res.status(200).json(createdVideo)

    } catch (e) {
        if (e.message === "Video details are missing.") {
            return res.status(400).json({message: "Video details are missing."});
        }

        console.log('Error in POST Router /create', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

videoRouter.get('/delete/one', (req, res) => {
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


// delete multiple
import {deleteMultipleVideosWithUpdates} from "../customModules/video.js";

videoRouter.get('/delete/multiple', async (req, res) => {
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

export default videoRouter;