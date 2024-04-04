import {ObjectId} from "mongodb";
// import mongodb items
import {mongoClient, contentDb, mainDB} from "../dbSetup.js";

async function createCourseObject(courseDetails) {
    // check for missing values
    if (courseDetails.title === undefined || courseDetails.description === undefined ||
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
        enrolledStudents : [],
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

import {deleteModule} from "./cModule.js";

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
    const course = await mongoClient.db(contentDb).collection('courses').findOne({_id: new ObjectId(courseId)})
    if (!course) {
        console.log('Course not found')
        throw new Error("Course not found")
    }

    // Check if course.modules is not empty
    if (course.modules && course.modules.length > 0) {
        console.log('Course has modules')
        for (let moduleId of course.modules) {
            console.log('Deleting module', moduleId)
            await deleteModule(moduleId) // this will delete the videos also
        }
    }

    // delete course now
    const courseRef = await mongoClient.db(contentDb).collection('courses').deleteOne({_id: new ObjectId(courseId)})
    if (courseRef.deletedCount === 0) {
        console.log('Course not deleted')
        throw new Error('Course not deleted.')
    } else {
        console.log('Course deleted')
        return true
    }
}


export async function enrollStudent(courseId, studentId) {
    const course = await mongoClient.db(contentDb).collection('courses').findOne({_id: new ObjectId(courseId)})
    if (course === undefined) {
        console.log('Course not found')
        throw new Error('Course not found.')
    }

    


    if (course.enrolledStudents.includes(studentId)) {
        console.log('Student already enrolled')
        throw new Error('Student already enrolled.')
    }

    const courseRef = await mongoClient.db(contentDb).collection('courses').updateOne({_id: new ObjectId(courseId)}, {
        $push: {
            enrolledStudents: studentId
        }
    })

    const studentRef = await mongoClient.db(mainDB).collection('users').updateOne({uid: studentId}, {
        $push: {
            enrolledCourses: new ObjectId(courseId)
        }
    
    })


    console.log('course', course)
    console.log('student', studentId, studentRef)

    if (courseRef.modifiedCount === 0 || studentRef.modifiedCount === 0) {
        console.log('Student not enrolled. Server Error.')
        throw new Error('Student not enrolled. Server Error.')
    } else {
        console.log('Student enrolled') 
        return true
    }
}