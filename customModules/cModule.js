import {contentDb, mongoClient} from "../dbSetup.js";
import {ObjectId} from "mongodb";

async function createModuleObject(courseId, moduleDetails) {

    if (courseId === undefined || moduleDetails.title === undefined || moduleDetails.description === undefined ||
        moduleDetails.sortingIndex === undefined) {
        console.log("Modules details are missing when creating new module Object inside createModuleObject function")
        throw new Error("Modules details are missing.")
    }

    if (isNaN(moduleDetails.sortingIndex)) {
        console.log("Sorting Index is not a number")
        throw new Error("Sorting Index is not a number")
    }

    console.log('Module Object created')
    return {
        courseId: new ObjectId(courseId),
        title: moduleDetails.title,
        description: moduleDetails.description,
        videos: [],
        numberOfVideos: 0,
        sortingIndex: moduleDetails.sortingIndex
    }
}


export async function createModule(courseId, moduleDetails) {
    // add new
    let moduleRef
    try {
        const module = await createModuleObject(courseId, moduleDetails)
        moduleRef = await mongoClient.db(contentDb).collection('modules').insertOne(module)
        console.log('Inserted new module: ', moduleRef.insertedId)
    } catch (e) {
        throw new Error(e)
    }


    // update the course data
    const course = await mongoClient.db(contentDb).collection('courses').findOne({_id: new ObjectId(courseId)})
    if (course.length === 0)
        throw new Error('Course not found in database.')
    else {
        // update
        course.modules.push(moduleRef.insertedId)
        const updatedCourse = await mongoClient.db(contentDb).collection('courses').updateOne({_id: new ObjectId(courseId)}, {$set: course})
        return moduleRef
    }
}


export async function getAllModules(courseId) {
    const modules = await mongoClient.db(contentDb).collection('modules').find({courseId: ObjectId(courseId)}).toArray()
    if (modules.length === 0) throw new Error('No modules found for this course.')
    else return modules
}

export async function getModule(moduleId) {
    const module = await mongoClient.db(contentDb).collection('modules').findOne({_id: ObjectId(moduleId)})
    if (!module) throw new Error('Module not found.')
    else return module
}

export async function deleteModule(moduleId) {
    let id
    if (typeof moduleId !== ObjectId) {
        id = await moduleId
    } else {
        id = await new ObjectId(moduleId)
    }

    console.log(id)

    const module = await mongoClient.db(contentDb).collection('modules').findOne({_id: id})
    if (!module) throw new Error('Module not found.')

    const course = await mongoClient.db(contentDb).collection('courses').findOne({_id: module.courseId})
    if (!course) throw new Error('Course not found.')

    // remove module from course
    course.modules = course.modules.filter(m => m !== moduleId)
    await mongoClient.db(contentDb).collection('courses').updateOne({_id: module.courseId}, {$set: course})

    // remove videos inside module
    for (let videoId of module.videos) {
        let deletedVideo = await mongoClient.db(contentDb).collection('videos').deleteOne({_id: new ObjectId(videoId)})
        if (deletedVideo.deletedCount === 0) console.log(`Video with ID ${videoId} not found. Skipping Delete ...`)
    }

    // remove module
    const deletedModule = await mongoClient.db(contentDb).collection('modules').deleteOne({_id: new ObjectId(moduleId)})
    console.log(deletedModule)
    if (deletedModule.deletedCount === 0) throw new Error('No Module was Deleted.')
    else return deletedModule

}

export async function addMultipleModules(courseId, modules) {
    let moduleRefs = []
    for (let module of modules) {
        try {
            let moduleRef = await createModule(courseId, module)
            moduleRefs.push(moduleRef)
        } catch (e) {
            console.log('Error while adding module: ', e)
            throw new Error(e)
        }
    }
    return moduleRefs

}