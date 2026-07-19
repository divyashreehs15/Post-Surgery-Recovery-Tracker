# Post-Surgery Recovery Tracker - Backend

Node.js + Express backend for managing post-surgery recovery submissions with file uploads and MongoDB.

## Requirements
- Node.js 18+
- MongoDB (local or Atlas)

## Setup
1. Install dependencies:
```bash
npm install
```

2. Create an `.env` file in the `Backend` folder:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/Post-SurgeryDB
UPLOAD_DIR=uploads
JWT_SECRET=supersecret_jwt_key_change_me
```

3. Build and run (development):
```bash
npm run dev
```

4. Build and run (production):
```bash
npm run build
npm start
```

Static folders:
- `/public` served at `/public`
- `/uploads` served at `/uploads`

## Authentication
Routes:
- POST `/api/auth/register` — body: `{ name, email, password }`
- POST `/api/auth/login` — body: `{ email, password }`

Responses include a `token` field. Use it in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Recovery API (Protected)
Base URL: `http://localhost:5000`

### POST /api/recovery
Submit recovery data and an optional file.
- Auth: `Authorization: Bearer <token>`
- Content-Type: `multipart/form-data`
- Fields:
  - `patientName` (string, required)
  - `surgeryType` (string, required)
  - `recoveryProgress` (number|string, required)
  - `followUpDate` (date string, optional)
  - `notes` (string, optional)
  - `fileUpload` (file, optional)

### GET /api/recovery
Get all recovery records for the authenticated user.

### GET /api/recovery/:id
Get a single recovery record owned by the user.

### DELETE /api/recovery/:id
Delete a record and its file if present.

## Testing with Postman
1. Register or login to obtain a JWT token.
2. Add `Authorization: Bearer <token>` to protected requests.
3. For file upload, use `form-data` and key `fileUpload`.

## Project Structure
```
src/
  config/db.ts
  server.ts
  app.ts
  middlewares/
    errorHandler.ts
    upload.ts
    auth.ts
  models/
    User.ts
    Recovery.ts
  controllers/
    authController.ts
    recoveryController.ts
  routes/
    authRoutes.ts
    recoveryRoutes.ts
public/
uploads/
```

## Notes
- Uploaded files are stored under `UPLOAD_DIR` with unique filenames.
- File metadata (original name, path, upload date) is stored alongside each record.
- CORS, Helmet, and centralized error handling are enabled.
