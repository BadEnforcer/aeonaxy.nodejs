import {Router} from "express";

// ! PREFIX : /webhooks

const resendWebhooksRouter = Router()

resendWebhooksRouter.post('/resend/emailSent',
    async (req, res) => {
    console.log(req.body)
    res.send('ok').status(200)
})

resendWebhooksRouter.post('/resend/emailBounced',(req, res) => {
    console.log(req.body)
    res.send('ok').status(200)
})

resendWebhooksRouter.post('/resend/emailOpened',(req, res) => {
    console.log(req.body)
    res.send('ok').status(200)
})

resendWebhooksRouter.post('/resend/emailClicked',(req, res) => {

})

resendWebhooksRouter.post('/resend/emailDelivered',(req, res) => {

})

export default resendWebhooksRouter