import {contentDb, mongoClient} from "../dbSetup.js";
import {ObjectId} from "mongodb";

/**
 * @function createModuleObject
 * @description Creates a new module object.
 * @param {string} courseId - The ID of the course.
 * @param {Object} moduleDetails - An object containing the details of the module.
 * @returns {Object} The created module object.
 * @throws {Error} If any of the required fields are missing or if the sorting index is not a number.
 */
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

/**
 * @function createModule
 * @description Creates a new module and adds it to a course.
 * @param {string} courseId - The ID of the course.
 * @param {Object} moduleDetails - An object containing the details of the module.
 * @returns {Object} The reference to the created module in the database.
 * @throws {Error} If the module could not be created or if the course could not be found in the database.
 */
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


/**
 * @function getAllModules
 * @description Retrieves all modules for a given course.
 * @param {string} courseId - The ID of the course.
 * @returns {Array} An array of module objects.
 * @throws {Error} If no modules are found for the course.
 */
export async function getAllModules(courseId) {
    const modules = await mongoClient.db(contentDb).collection('modules').find({courseId: ObjectId(courseId)}).toArray()
    if (modules.length === 0) throw new Error('No modules found for this course.')
    else return modules
}

/**
 * @function getModule
 * @description Retrieves a specific module.
 * @param {string} moduleId - The ID of the module.
 * @returns {Object} The module object.
 * @throws {Error} If the module is not found.
 */
export async function getModule(moduleId) {
    const module = await mongoClient.db(contentDb).collection('modules').findOne({_id: ObjectId(moduleId)})
    if (!module) throw new Error('Module not found.')
    else return module
}

/**
 * @function deleteModule
 * @description Deletes a specific module and removes it from its course.
 * @param {string} moduleId - The ID of the module.
 * @returns {Object} The result of the delete operation.
 * @throws {Error} If the module or its course is not found.
 */
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

/**
 * @function addMultipleModules
 * @description Adds multiple modules to a course.
 * @param {string} courseId - The ID of the course.
 * @param {Array} modules - An array of module objects.
 * @returns {Array} An array of references to the created modules in the database.
 * @throws {Error} If a module could not be created.
 */
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