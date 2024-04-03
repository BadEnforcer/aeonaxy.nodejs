import {Router} from "express";

const moduleRouter = Router();


import {createModule} from "../customModules/cModule.js";
import {ObjectId} from "mongodb";
import mongoClient, {contentDb} from "../dbSetup.js";
moduleRouter.post('/create', async (req, res) => { // WORKS!!
    const moduleDetails = {
        title: req.body.title,
        description: req.body.description,
        sortingIndex: req.body.sortingIndex
    }

    try {
        const createdModule = await createModule(req.body.courseId, moduleDetails);
        if (createdModule=== [] || createdModule === null || createdModule === undefined) {
            return res.status(400).json({message: "Module Not created Server Error."});
        }

        return res.status(200).json(createdModule)

    } catch (e) {
        if (e.message === "Module details are missing.") {
            return res.status(400).json({message: "Module details are missing."});
        }

        console.log('Error in POST Router /create', e);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

export default moduleRouter;