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

export async function verifySuperAdmin(req = Request, res = Response, next) {
    // get the 

    next();
}

export async function preventDuplicateLogin(req = Request, res = Response, next) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        next();
    } else {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                next();
            } else {
                res.status(403).json({ message: 'Please log out before logging in again.' });
            }
        });
    }
};