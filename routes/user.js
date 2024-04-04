import {Router} from 'express';
import bcrypt from 'bcrypt'
import jsonwebtoken from 'jsonwebtoken'
import {v4 as uuidv4} from 'uuid';

// ? import multer for file uploads
import multer from 'multer'
// ! Setup Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({storage: storage});

// ? import dbSetup and mongodb
import {mongoClient, mainDB, passwordsDb} from "../dbSetup.js";
import {ObjectId} from "mongodb";

// ? import custom error class
import CustomError from "../Classes/customError.js";

// ? setup dotenv
import configDotenv from 'dotenv'
configDotenv.config()

// ? setup custom customModules and middlewares
import {sendVerificationEmail} from "../customModules/resendapi.js";

// middlewares
import {verifyToken} from "../middlewares/middlewares.js";


const userAPIRouter = Router()

// ! Setup Routes
// create a user
userAPIRouter.post('/create', upload.single('profileImage'), async (req, res) => {
    // ? extract variables from request

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const profilePic = req.file; // This will hold the uploaded file data
    const userSecret = req.body.userSecret;
    console.log(name, email, password)


    // ? check all variables are valid
    if (!name || !email || !password) {
        res.status(400).send({
            status: 'error', message: 'Missing required fields'
        })
    }

    // ? check if user already exists
    const userExists = await mongoClient.db(mainDB).collection('users').findOne({email: email})
    if (userExists) {
        res.status(400).send({
            status: 'error', message: 'User already exists'
        })
    }

    // ? check password strength
    // TODO: implement password strength check in complex way
    if (password.length < 8) {
        res.status(400).send({
            status: 'error', message: 'Password too short'
        })
    }


    try {
        // ? hash the password
        const hashedPassword = await bcrypt.hash(password, Number(process.env["SALT_ROUNDS"]));

        // ? generate an uid
        // since this is unique in space and time. we might not need to check if it already exists
        const uid = uuidv4()

        // ? create a user object
        const user = {
            uid: uid,
            name: name,
            email: email,
            profileImg: profilePic,
            enrolledCourses: [],
            isActive: true,
            emailVerified: false,
            createdOn: new Date(),
            updatedOn: new Date(),
            userSecret: userSecret // using this instead of 2FA for now
        }

        // ? insert user into users collection
        const userRef = await mongoClient.db(mainDB).collection('users').insertOne(user)
        console.log(`Debug: User inserted with id: ${userRef.insertedId}`)

        // ? get user's insertedId and store password hash in PasswordDB
        const passwordRef = await mongoClient.db(passwordsDb).collection('passHash').insertOne({
            user: new ObjectId(userRef.insertedId), hashedPassword: hashedPassword
        })
        console.log(`Debug: Password inserted with id: ${passwordRef.insertedId}`)

        // ? send verification email
        const verificationToken = await jsonwebtoken.sign({uid: uid}, process.env["JWT_SECRET"], {expiresIn: '2d'})
        const emailStatus = await sendVerificationEmail(name, email, verificationToken)
        // ? store the token in db, and set it's creating time
        await mongoClient.db(passwordsDb).collection('emailVerificationTokens').insertOne({
            user: new ObjectId(userRef.insertedId), token: verificationToken, createdAt: new Date()
        })
        // console.log(`Debug: Email sent status: ${JSON.stringify(emailStatus, null, 2)}`)

        // ? sign in the user using JWT for 7 Days
        const token = await jsonwebtoken.sign({uid: uid}, process.env["JWT_SECRET"], {expiresIn: '15m'})

        // ? Generate a refresh token (long-lived)
        const refreshToken = jsonwebtoken.sign({uid}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})

        // ? send response, Save the refresh token (e.g., store it in an HTTP-only cookie)
        // TODO: Disable httpOnly in production
        res.status(200).cookie('refreshToken', refreshToken, {httpOnly: true}).send({
            status: 'success',
            user: {
                uid: uid, name: name, email: email, accessToken: token
            },
            verificationEmailStatus: 'sent'
        })

    } catch (err) {
        console.log(err)
        res.status(500).send({
            status: 'error', message: 'Internal Server Error'
        })
    }
})


userAPIRouter.patch('/update', verifyToken, upload.single('profileImage'), async (req, res) => {
    if (!req.body.email) {
        return res.status(400).send({status: 'error', message: 'No Original email provided'}) // TODO: it should be req.user in production
    }
    if (!req.body.userSecret) {
        return res.status(400).send({status: 'error', message: 'No userSecret provided'})
    }

    try {
        const userRef = await mongoClient.db(mainDB).collection('users').findOne({email: req.body.email});


        if (!userRef) {
            return res.status(404).send({status: 'error', message: 'User not found'});
        } else {
            console.log(userRef.userSecret, req.body.userSecret);
        }


        if (req.body.userSecret !== userRef.userSecret) {
            return res.status(401).send({status: 'error', message: 'Unauthorized'})
        }

    } catch (err) {
        console.log("error finding user's secret", err)
        return res.status(500).send({status: 'error', message: 'Internal Server Error'})
    }

    console.log('checking details done')


    const updatedDetails = {}


    if (req.body.updatedName) updatedDetails.name = req.body.updatedName
    // check if email is new, if yes, send verification email and set email verified to false
    if (req.body.updatedEmail && req.body.email !== req.body.updatedEmail) {
        updatedDetails.email = req.body.updatedEmail
        updatedDetails.emailVerified = false
        console.log('new mail detected')
    }


    if (req.file) updatedDetails.profileImg = req.file
    if (req.isActive) updatedDetails.isActive = req.body.isActive

    if (updatedDetails !== {}) updatedDetails.updatedOn = new Date()
    else return res.send(400).send({status: 'error', message: 'No fields to update'})


    try {
        console.log('trying to update')
        const userRef = await mongoClient.db(mainDB).collection('users').findOneAndUpdate(
            {email: req.body.email}, {$set: updatedDetails}, {returnOriginal: false})

        if (req.body.updatedPassword) {
            const hashedPassword = await bcrypt.hash(req.body.updatedPassword, Number(process.env["SALT_ROUNDS"])); // TODO: implement password strength check
            console.log('new password hashed')
            console.log(userRef)
            await mongoClient.db(passwordsDb).collection('passHash').findOneAndUpdate(
                {user: new ObjectId(userRef._id)}, {$set: {hashedPassword: hashedPassword}})
            console.log('password updated')
        }

        if (req.body.updatedEmail) {
            // resend email verification
            const verificationToken = await jsonwebtoken.sign({uid: userRef.uid}, process.env["JWT_SECRET"], {expiresIn: '2d'})
            const emailStatus = await sendVerificationEmail(userRef.name, req.body.updatedEmail, verificationToken)
            // ? store the token in db, and set it's creating time
            await mongoClient.db(passwordsDb).collection('emailVerificationTokens').insertOne({
                user: new ObjectId(userRef.insertedId), token: verificationToken, createdAt: new Date()
            })
            console.log(`Debug: Email update msg sent status: ${JSON.stringify(emailStatus, null, 2)}`)
        }



        return res.send({status: 'success', message: 'User updated successfully'}).clearCookie('refreshToken')

    } catch (err) {
        console.log(err)
        return res.status(500).send({status: 'error', message: 'Internal Server Error'})
    }
})


userAPIRouter.post('/login', async (req, res) => {
    const {email, password} = req.body;
    console.log(email, password)
    // TODO: fix password matching
    // Validate request
    if (!email || !password) {
        return res.status(400).json({message: 'Missing required fields'});
    }

    // Retrieve user
    const user = await mongoClient.db(mainDB).collection('users').findOne({email});
    if (user === undefined || user === null) {
        console.log('User not found')
        return res.status(400).json({message: 'Invalid email or password'});
    }

    // Check password
    const passwordRecord = await mongoClient.db(passwordsDb).collection('passHash').findOne({user: new ObjectId(user._id)});
    const isPasswordMatch = await bcrypt.compare(password, passwordRecord.hashedPassword);


    if (!isPasswordMatch) {
        return res.status(400).json({message: 'Invalid email or password'});
    }

    // Generate tokens
    const token = jsonwebtoken.sign({uid: user.uid}, process.env.JWT_SECRET, {expiresIn: '15m'});
    const refreshToken = jsonwebtoken.sign({uid: user.uid}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});

    // Update last login
    await mongoClient.db(mainDB).collection('users').updateOne({_id: new ObjectId(user._id)}, {$set: {lastLogin: new Date()}});

    console.log('user logged in')

    // Send response
    res.status(200).cookie('refreshToken', refreshToken, {httpOnly: true}).json({
        status: 'success',
        user: {
            uid: user.uid,
            name: user.name,
            email: user.email,
            accessToken: token
        }
    });
});


userAPIRouter.post('/refresh-token', verifyToken, (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({message: 'Unauthorized'});
    }

    // check if refresh token is valid
    jsonwebtoken.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({message: 'Refresh token expired, Sign in again'});

                // NOTE: In a complete project, you would redirect to login page.
            }
            return res.status(403).json({message: 'Forbidden'});
        }

        // Generate new access token
        const token = jsonwebtoken.sign({uid: user.uid}, process.env.JWT_SECRET, {expiresIn: '15m'});
        console.log('New refresh token generated')
        res.status(200).json({accessToken: token});
    });
});
userAPIRouter.post('/logout', (req, res) => {
    res.clearCookie('refreshToken').json({message: 'Logged out'}).status(200);
});

export default userAPIRouter