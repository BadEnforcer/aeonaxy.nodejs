/**
 * @fileoverview This module provides routes for course-related operations.
 */

// Importing required modules

import {Router} from "express";

const courseRouter = Router();
import {verifyToken} from "../middlewares/middlewares.js";


import {createCourse, deleteCourse, enrollStudent} from "../customModules/courses.js";
/**
 * Route to create a new course.
 * @name post/create
 * @function
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
courseRouter.post('/create',verifyToken, async (req, res) => { // WORKS!!
    const courseDetails = {
            title: req.body.title,
            description: req.body.description,
            categories: req.body.categories,
            price: req.body.price,
            skill_lvl: req.body.skill_lvl
    }

    try {
        const createdCourse = await createCourse(courseDetails);
        res.status(200).json(createdCourse);
    } catch (e) {
        if (e.message === "Course details are missing.") {
            return res.status(400).json({message: "Course details are missing."});
        }

        console.log('Error in POST Router /create', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

import {addMultipleModules} from "../customModules/cModule.js";
import mongoClient, {contentDb} from "../dbSetup.js";
import {ObjectId} from "mongodb";
import { updateLastRequest, verifySuperAdmin } from "../customModules/superadmin.js";

/**
 * Route to create a new course and its modules as one operation.
 * @name post/create/asOne
 * @function
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
courseRouter.post('/create/asOne',verifySuperAdmin, updateLastRequest, async (req, res) => {
    const data = req.body.data;

    // Extract course details and modules from data
    const courseDetails = data.course;
    const modules = data.course.modules;


    // Create the course
    try {
        const createdCourse = await createCourse(courseDetails);
        console.log('Debug: Created course.', createdCourse);

        // If modules are provided, add them to the course
        if (modules && modules.length > 0) {
            const modulesRefs = await addMultipleModules(createdCourse.insertedId, modules);
            console.log('Debug: Added modules to course.',modulesRefs);
        }

        res.status(200).json(createdCourse);

    } catch (e) {
        if (e.message === "Course details are missing.") {
            return res.status(400).json({message: "Course details are missing."});
        }

        console.log('Error in POST Router /create/asOne', e);
        return res.status(500).json({message: 'Internal Server Error'});

    }
});

/**
 * Route to delete a course.
 * @name post/delete
 * @function
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
courseRouter.post('/delete',verifySuperAdmin, updateLastRequest, async (req, res) => {
    const courseID = req.body.courseId;

    try {
        const deletedCourse = await deleteCourse(courseID);
        res.status(200).json(deletedCourse);
    } catch (e) {
        console.log('Error in POST Router /delete', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})



/**
 * Route to update a course.
 * @name patch/update
 * @function
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
courseRouter.patch('/update', verifySuperAdmin, updateLastRequest,async (req, res)=> {
    const courseId = req.body.courseId;
    console.log(courseId)
    if(courseId === undefined) {
        return res.status(400).json({message: "Course ID is missing."});
    }

    // get course details
    const courseDetails = await mongoClient.db(contentDb).collection('courses').findOne({_id: new ObjectId(courseId)});
    console.log(courseDetails)
    if (courseDetails === null ) {
        return res.status(404).json({message: "Course not found."});
    } else if (courseDetails.length === 0) {
        return res.status(400).json({message: "Course not found."});
    }
    else if (req.body.title === undefined &&
        req.body.description === undefined &&
        req.body.categories === undefined &&
        req.body.price === undefined &&
        req.body.skill_lvl === undefined) {
        return res.status(400).json({message: "No fields to update."});
    }


    if (req.body.categories || req.body.categoryInsert === undefined) {
        const warning = "Categories are missing." +
            " appending them by default. provide 'categoryInsert' field with the value 'replace' to replace.";
    }


    if(req.body.title) {
        courseDetails.title = req.body.title;
    }
    if(req.body.description) {
        courseDetails.description = req.body.description;
    }
    if(req.body.categories) {
        if (req.body.categoryInsert === 'replace')
            courseDetails.categories = req.body.categories

        else courseDetails.categories.push(req.body.categories)

    }
    if(req.body.price) {
        courseDetails.price = req.body.price;
    }
    if(req.body.skill_lvl) {
        courseDetails.skill_lvl = req.body.skill_lvl;
    }

    try {
        const updatedCourse = await mongoClient.db(contentDb).collection('courses').updateOne({_id: new ObjectId(courseId)}, {$set: courseDetails});
        res.status(200).json(updatedCourse);
    } catch (e) {
        console.log('Error in PATCH Router /update', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }

})


/**
 * Route to enroll a student in a course.
 * @name post/enroll
 * @function
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
courseRouter.post('/enroll',verifyToken, async (req, res) => {
    try {

        if(req.body.courseId === undefined) {
            return res.status(400).json({message: "Course ID is missing."});
        }

        console.log(req.session)
    const courseId = req.body.courseId;
    const studentId = req.session.user.uid; // get user's UID



        await enrollStudent(courseId, studentId);
        res.status(200).json({message: "Student enrolled."});
    } catch (e) {

        if (e.message === "Course not found.") {
            return res.status(404).json({message: "Course not found."});
        
        }
        if (e.message === "Student already enrolled.") {
            return res.status(400).json({message: "Student already enrolled."});
        }

        console.log('Error in POST Router /enroll', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})



export default courseRouter;