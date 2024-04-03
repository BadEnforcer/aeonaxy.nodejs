import {Router} from "express";

const courseRouter = Router();


import {createCourse} from "../customModules/courses.js";
courseRouter.post('/create', async (req, res) => { // WORKS!!
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

export default courseRouter;