import {Router} from "express";

const courseRouter = Router();
import {verifyToken} from "../middlewares/middlewares.js";

import {createCourse, deleteCourse} from "../customModules/courses.js";
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

courseRouter.post('/create/asOne',verifyToken, async (req, res) => {
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


courseRouter.post('/delete',verifyToken, async (req, res) => {
    const courseID = req.body.courseId;

    try {
        const deletedCourse = await deleteCourse(courseID);
        res.status(200).json(deletedCourse);
    } catch (e) {
        console.log('Error in POST Router /delete', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})


export default courseRouter;