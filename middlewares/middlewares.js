

import jwt from "jsonwebtoken";
// verify the jwt for each request
export async function verifyToken(req = Request, res = Response, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }

    // Extract the token from the Bearer token format
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        req.body.userId = decoded.id; // set user's ID for other middlewares

        next();
    });
}