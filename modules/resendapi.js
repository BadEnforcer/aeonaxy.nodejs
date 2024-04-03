import {Resend} from 'resend';
import dotenv from 'dotenv';
dotenv.config({path: '../.env'});


// ! REMOVE IN PRODUCTION
const RESEND_API_KEY='re_ABzeHqLC_2jsUJKXB9ZVX2YDT8iqiqLrF'

const resend = new Resend(String(RESEND_API_KEY));
console.log('Resend API Key:', RESEND_API_KEY);


async function sendVerificationEmail(name, email, verificationToken) {
    const link = `https://nodejsinternship.el.r.appspot.com/verifyEmail?email=${email}&token=${verificationToken}`
    const emailVerificationMsg = `
    <p>Hey, ${name},</p>
    <p>An account was created using this email ID. Here is the verification link:</p>
    <p><a href="${link}" target="_blank">Verify Email</a></p>
    <p>If you did not make this request, please contact <a href="mailto:support@updates.rajdwivedi.space">support@updates.rajdwivedi.space</a>.</p>
    `;

    try {
        const {data, error} = await resend.emails.send({
            from: 'raj@updates.rajdwivedi.space',
            to: email,
            subject: 'Email Verification',
            html: emailVerificationMsg,
        });

        if (error) {
            console.error(error);
            throw new Error(error);
        }

        console.log(data);
        return data;
    } catch (e) {
        console.error(e);
        throw e;
    }
}




export  { sendVerificationEmail };

