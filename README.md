# aeonaxy.nodejs


This project is a Node.js application that provides a set of APIs for managing courses. It uses Express.js for routing and MongoDB for data storage.

## Routes

### POST /create/asOne

This route is used to create a new course. The course details should be provided in the request body. If any required details are missing, the server will respond with a 400 status code and a message indicating that course details are missing.

### POST /delete

This route is used to delete a course. The ID of the course to be deleted should be provided in the request body. If the course is not found, the server will respond with a 500 status code and a message indicating an internal server error.

### PATCH /update

This route is used to update a course. The ID of the course to be updated and the new details should be provided in the request body. If the course is not found, the server will respond with a 404 status code and a message indicating that the course was not found. If no fields to update are provided, the server will respond with a 400 status code and a message indicating that no fields to update were provided.

### POST /enroll

This route is used to enroll a student in a course. The ID of the course should be provided in the request body. If the course is not found, the server will respond with a 404 status code and a message indicating that the course was not found. If the student is already enrolled in the course, the server will respond with a 400 status code and a message indicating that the student is already enrolled.

### GET /search/course

This route is used to search for courses. The search parameters should be provided in the request query. The server will respond with a list of courses that match the search parameters.

### GET /search/module

This route is used to search for modules. The search parameters should be provided in the request query. The server will respond with a list of modules that match the search parameters.

### GET /search/video

This route is used to search for videos. The search parameters should be provided in the request query. The server will respond with a list of videos that match the search parameters.

### POST /superadmin/create

This route is used to create a new superadmin. The superadmin details should be provided in the request body. If any required details are missing, the server will respond with a 500 status code and a message indicating an internal server error.

### POST /superadmin/login

This route is used to log in a superadmin for the first time. The superadmin credentials should be provided in the request body. If any required details are missing or incorrect, the server will respond with a 403 status code and a message indicating incorrect credentials.

### POST /superadmin/regen-token

This route is used to regenerate a superadmin's access token. This route is protected by superadmin verification middleware. It also performs a pre-token generation check. If the check passes, the server will respond with a 200 status code and the new access token.

### POST /module/create

This route is used to create a new module. The module details should be provided in the request body. It is protected by superadmin verification middleware. If any required details are missing, the server will respond with a 400 status code and a message indicating that module details are missing.

### POST /module/delete

This route is used to delete a module and its videos. The module ID and course ID should be provided in the request body. It is protected by superadmin verification middleware. If the module is not found, the server will respond with a 500 status code and a message indicating an internal server error.

### POST /video/create

This route is used to create a new video. The video details and a single file upload with the field name 'video' should be provided in the request body. It is protected by superadmin verification middleware. If any required details are missing, the server will respond with a 400 status code and a message indicating that video details are missing.

### GET /video/delete/one

This route is used to delete a single video. The video ID should be provided in the request body. It is protected by superadmin verification middleware. If the video is not found, the server will respond with a 400 status code and a message indicating that the video was not found.

### GET /video/delete/multiple

This route is used to delete multiple videos. The video IDs should be provided in the request body. It is protected by superadmin verification middleware. If any of the videos are not found, the server will respond with a 500 status code and a message indicating an internal server error.

### POST /webhooks/resend/emailSent

This route is used to resend an email that was sent. The server will respond with a 200 status code and a message indicating that the request was received.

### POST /webhooks/resend/emailBounced

This route is used to resend an email that bounced. The server will respond with a 200 status code and a message indicating that the request was received.

### POST /webhooks/resend/emailOpened

This route is used to resend an email that was opened. The server will respond with a 200 status code and a message indicating that the request was received.

### POST /webhooks/resend/emailClicked

This route is used to resend an email that was clicked. The server will respond with a 200 status code and a message indicating that the request was received.

### POST /webhooks/resend/emailDelivered

This route is used to resend an email that was delivered. The server will respond with a 200 status code and a message indicating that the request was received.

## Environment Variables

The application uses the following environment variables:

- `SALT_ROUNDS`: The number of rounds to use when hashing passwords.
- `JWT_SECRET`: The secret key to use when signing JWTs.
- `REFRESH_TOKEN_SECRET`: The secret key to use when signing refresh tokens.
- `RESEND_API_KEY`: The API key to use when resending emails.
- `SESSION_SECRET`: The secret key to use when signing session cookies.
- `SECRET_KEY`: The secret key to use for the superadmin.

Please note that these environment variables should be kept secret and not committed to version control.
