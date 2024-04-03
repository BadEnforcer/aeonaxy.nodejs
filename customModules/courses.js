import {ObjectId} from "mongodb";
// import mongodb items
import {mongoClient, contentDb, mainDB} from "../dbSetup.js";

async function createCourseObject(courseDetails) {
    // check for missing values
    if (courseDetails.title  === undefined || courseDetails.description === undefined ||
        courseDetails.categories === undefined || courseDetails.price === undefined ||
        courseDetails.skill_lvl === undefined) {

        console.log('error in createCourseObjectFunction when checking for missing fields')
        throw new Error("Course details are missing.")
    }


    console.log('Course Object created')

    return { // return the new course object
        title: courseDetails.title,
        description: courseDetails.description,
        categories: courseDetails.categories,
        price: courseDetails.price,
        modules: [],
        created_at: Date.now(),
        skill_lvl: courseDetails.skill_lvl
    }
}


export async function createCourse(courseDetails) {
    const course = await createCourseObject(courseDetails)
    const courseRef = await mongoClient.db(contentDb).collection('courses').insertOne(course)
    if (courseRef.length === 0) {
        console.log('Course not created. courseRef.length is empty')
        throw new Error('Course not created.')
    } else {
        console.log('Debug: Course created with iD', courseRef.insertedId)
        return courseRef
    }
}


export async function getCourse(courseId) {
    const course = await mongoClient.db(contentDb).collection('courses').findOne({_id: ObjectId(courseId)})
    if (!course) {
        console.log('Course not found')
        throw new Error('Course not found.')
    } else {
        console.log('Course found')
        return course
    }
}

export async function deleteCourse(courseId) {
    const course = await mongoClient.db(contentDb).collection('courses').findOne({_id: ObjectId(courseId)})
    if (!course) throw new Error('Course not found.')

    // delete videos in each module
    const modules = course.modules
    for (let i = 0; i < modules.length; i++) {
        const module = modules[i]
        const videos = module.videos
        for (let j = 0; j < videos.length; j++) {
            const video = videos[j]
            const deletedVideo = await mongoClient.db(contentDb).collection('videos').deleteOne({_id: ObjectId(video)})
            if (deletedVideo.deletedCount === 0) console.log(`WARNING: No video deleted with ID: ${video} .either the video did not exist or there is an error somewhere`)
        }
    }


    const deletedModules = await mongoClient.db(contentDb).collection('modules').deleteMany({course_id: ObjectId(courseId)})
    if (deletedModules.deletedCount === 0) console.log('WARNING: No modules deleted. either the course was empty or there is an error somewhere')


    const deletedCourse = await mongoClient.db(contentDb).collection('courses').deleteOne({_id: ObjectId(courseId)})
    if (deletedCourse.deletedCount === 0) {
        console.log('Course not deleted')
        throw new Error('Course not deleted in final Check.')
    } else {
        console.log('Course deleted')
        return deletedCourse
    }


}