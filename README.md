# Tomorrow is Better

Tomorrow is Better is a full-stack file-sharing workspace built with React, Express, MongoDB, and Node.js. Upload files to a private library, preview supported formats in the browser, manage your profile, and create shareable download links.

## Features

- Secure account registration and login with JWT authentication
- Private file library for each signed-in user
- Drag-and-drop file uploads up to 100 MB
- Image, video, audio, PDF, and text previews
- Public share links with download support
- Searchable file library with size and download statistics
- Editable profile details and job role
- Admin-only user directory and access-role management
- Responsive white workspace UI for desktop and mobile
- Browser, iOS, and Android favicon/PWA metadata

## Tech Stack

- **Frontend:** React, Vite, Lucide React
- **Backend:** Node.js, Express, Multer
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT and bcrypt

## Requirements

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas connection string

## Getting Started

Clone the repository and install all dependencies:

```bash
npm run install-all
```

Create the server environment file:

```bash
copy backend\.env.example backend\.env
```

Update `server/.env` with your local configuration, then start the client and API together:

```bash
npm run dev
```

Open the client at [http://localhost:5173](http://localhost:5173).

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/dropvault
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-this-with-a-long-random-secret
```

Use a long, private value for `JWT_SECRET` outside local development.

## Available Scripts

Run these commands from the repository root:

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `npm run install-all` | Install root, server, and client dependencies |
| `npm run dev`         | Start the API and Vite client together        |
| `npm run server`      | Start only the API with nodemon               |
| `npm run client`      | Start only the Vite client                    |

Run these commands from `frontend/`:

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run build`   | Create a production client build    |
| `npm run preview` | Preview the production client build |

## File Storage

Uploaded files are stored on disk in `backend/uploads`. File metadata, users, roles, share tokens, and download counts are stored in MongoDB.

## Deploying to Vercel

The Vite frontend is configured for Vercel. From the repository root, import the repository into Vercel; `vercel.json` supplies the build command and SPA fallback. Add this Vercel environment variable:

```env
VITE_API_URL=https://your-public-api-url.example.com/api
```

The Express API should be deployed as a separate Node service because uploaded files are written to `backend/uploads`, and Vercel function filesystems are ephemeral. Set these variables on that service:

```env
MONGODB_URI=your-mongodb-atlas-connection-string
CLIENT_URL=https://your-frontend.vercel.app
JWT_SECRET=use-a-long-random-secret
```

Deploy the `backend` directory with `npm start`, then put its public URL (ending in `/api`) into Vercel as `VITE_API_URL`. Configure MongoDB Atlas network access for the API host before testing sign-up and uploads.

The application does not expose another user's private library. Public share links expose only the specific file associated with the token.

## Roles and Profiles

Every account has:

- A **job role**, such as Designer, Developer, or Project Manager
- An **access role**, either `user` or `admin`

New accounts are regular users by default. Administrators can manage access roles from the Profile page. To create the first administrator, update a user document in MongoDB:

```js
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } },
);
```

## API Overview

| Method  | Endpoint                  | Authentication  |
| ------- | ------------------------- | --------------- |
| `POST`  | `/api/auth/signup`        | Public          |
| `POST`  | `/api/auth/login`         | Public          |
| `GET`   | `/api/auth/me`            | Required        |
| `PATCH` | `/api/auth/profile`       | Required        |
| `GET`   | `/api/files`              | Required        |
| `POST`  | `/api/files`              | Required        |
| `GET`   | `/api/files/:id/download` | Public file URL |
| `GET`   | `/api/share/:token`       | Public          |
| `GET`   | `/api/users`              | Admin           |
| `PATCH` | `/api/users/:id/role`     | Admin           |

## Project Structure

```text
frontend/          React and Vite frontend
backend/           Express API, MongoDB models, and uploads
backend/uploads/   Uploaded file storage
```

## License

This project is available for personal and educational use. Add a project-specific license before publishing it as an open-source package.
