import {Resend} from 'resend';
import dotenv from 'dotenv';
dotenv.config({path: '../.env'});


// ! REMOVE IN PRODUCTION
const RESEND_API_KEY=''; // update the resend api key here

const resend = new Resend(String(RESEND_API_KEY));
console.log('Resend API Key:', RESEND_API_KEY);


export async function sendVerificationEmail(name, email, verificationToken) {
    const link = `https://nodejsinternship.el.r.appspot.com/api/user/verifyEmail?email=${email}&token=${verificationToken}`
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

export async function sendPasswordResetMail(email, resetToken) {
    const link = `https://nodejsinternship.el.r.appspot.com/api/user/resetPassword?email=${email}&token=${resetToken}`
    const invalidateLink = `https://nodejsinternship.el.r.appspot.com/api/user/invalidateResetPassword?email=${email}&token=${resetToken}`
    const emailVerificationMsg = `
    <p>Hey</p>
    <p>You requested a password reset. Here is the password reset link: (valid for 2 days)</p>
    <p><a href="${link}" target="_blank">Reset Password</a></p>
    <p>If you did not make this request click here to invalidate this password reset link right now: ${invalidateLink} </p>
    <p>please contact <a href="mailto:support@updates.rajdwivedi.space">support@updates.rajdwivedi.space</a>.</p>

    `
}




