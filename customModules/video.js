import {contentDb, mongoClient} from "../dbSetup.js";
import {ObjectId} from "mongodb";


async function createVideoObject(moduleId, videoDetails) {
    if (!moduleId || !videoDetails.title || !videoDetails.description || !videoDetails.content || !videoDetails.sortingIndex) {
        console.log("Video details are missing when creating new video Object inside createVideoObject function")
        throw new Error("Video details are missing.")
    }
    console.log('Video Object created')
    return {
        moduleId: ObjectId(moduleId),
        title: videoDetails.title,
        description: videoDetails.description,
        content: videoDetails.content,
        sortingIndex: videoDetails.sortingIndex
    }
}

export async function addVideo(moduleId, videoDetails) {
    const video = await createVideoObject(moduleId, videoDetails)
    const videoRef = await mongoClient.db(contentDb).collection('videos').insertOne(video)
    console.log('Inserted new video: ', videoRef.insertedId)

    // update the module data
    const module = await mongoClient.db(contentDb).collection('modules').findOne({_id: ObjectId(moduleId)})
    if (module.length === 0)
        throw new Error('Module not found in database.')
    else {
        // update
        module.videos.push(new ObjectId(videoRef.insertedId))
        const updatedModule = await mongoClient.db(contentDb).collection('modules').updateOne({_id: ObjectId(moduleId)}, {$set: module})
        return videoRef
    }
}

export async function getVideo(videoId) {
    const video = await mongoClient.db(contentDb).collection('videos').findOne({_id: ObjectId(videoId)})
    if (video.length === 0)
        throw new Error('Video not found in database.')
    return video
}


export async function getMultipleVideos(videoIds) {
    const objectIds = videoIds.map(id => ObjectId(id));
    const videos = await mongoClient.db(contentDb).collection('videos').find({_id: {$in: objectIds}}).toArray();
    if (videos.length === 0)
        throw new Error('Videos not found in database.');
    return videos;
}

export async function deleteVideo(videoId) {
    // get video from videoID
    const video = await mongoClient.db(contentDb).collection('videos').findOne({_id: new ObjectId(videoId)})
    if (video.length === 0)
        throw new Error('Video not found in database.')

    // Get module from moduleID inside Video Object
    const module = await mongoClient.db(contentDb).collection('modules').findOne({_id: new ObjectId(video.moduleId)})
    if (module.length === 0)
        throw new Error('Module not found in database.')

    // remove the videoId from module
    const updatedModule = await mongoClient.db(contentDb).collection('modules').updateOne(
        {_id: new ObjectId(video.moduleId)},
        {$set: {videos: module.videos.filter(v => v !== videoId)}})

    if (updatedModule.modifiedCount === 0)
        throw new Error('Module not updated in database.')


    // delete the video
    const deletedVideo = await mongoClient.db(contentDb).collection('videos').deleteOne({_id: new ObjectId(videoId)})
    if (deletedVideo.deletedCount === 0)
        throw new Error('Video not deleted from database.')
}