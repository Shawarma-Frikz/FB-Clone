# FB Social

A full-stack social media application with a React frontend and an Express/MongoDB backend.  
The app includes authentication, posts, stories, friends, profile customization (avatar + cover), chat, notifications, and real-time updates with Socket.IO.

## Tech Stack

- Frontend: React 19, Redux Toolkit, React Router, Axios, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO, Multer
- Media Storage: Cloudinary

## Monorepo Structure

```text
FB/
  Backend/      # Express API + Socket.IO server + MongoDB models
  Frontend/     # React app (Vite) + Redux store + pages/components
```

## Features

- Auth with JWT access/refresh tokens (register, login, token refresh, logout)
- Protected API routes with bearer token middleware
- Profile management:
  - Edit name and bio
  - Upload/change profile picture (avatar)
  - Upload/change cover picture
  - Image preview before save
  - Layout ensures cover does not hide profile picture
- Feed:
  - Create posts with text and optional images
  - Like/unlike posts
  - Comment on posts
  - Delete own posts
- Stories:
  - Upload image/video stories
  - Auto-expire after 24 hours (TTL index in MongoDB)
- Friends:
  - Send request
  - Accept/reject request
  - Remove friend
  - Suggestions list
- Chat:
  - One-to-one messaging
  - Text and file/image/video attachments
  - Typing indicators
  - Seen receipts
  - Online users presence
- Notifications:
  - Friend requests, accepted requests, likes, comments, posts, and new messages
  - Unread notification count
  - Mark-all-read endpoint
  - Real-time badge updates
  - Real-time toast popups in app shell

## Architecture Overview

### Frontend

- SPA routing in `Frontend/src/App.jsx`
  - Public: `/login`, `/register`
  - Protected app shell: `/app/*`
  - Main pages: feed, profile, friends, chat, notifications
- State management in `Frontend/src/store.js`:
  - `auth`, `posts`, `friends`, `chat` slices
- Shared API client in `Frontend/src/services/api.js`:
  - Automatically injects bearer token
  - Handles token refresh on `401` via `/auth/refresh`
- Real-time socket client in `Frontend/src/services/socket.js`
  - Uses `VITE_SOCKET_URL` if present
  - Falls back to API base URL host

### Backend

- Express app bootstrap in `Backend/app.js`
- HTTP server + Socket.IO initialization in `Backend/server.js`
- MongoDB connection in `Backend/config/db.js`
- REST routes (all except `/api/auth/*` are protected by auth middleware)
- Socket.IO events for chat/presence and notification fanout
- Notification realtime helpers in `Backend/sockets/realtime.js`

## Backend API Summary

Base URL: `http://localhost:5000/api` (default)

### Health

- `GET /health` - API health check

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Users / Profile / Friends

- `GET /users` - all users
- `GET /users/profile` - current user profile
- `PUT /users/profile` - update profile fields and/or upload `avatar` + `coverPhoto`
- `GET /users/friends` - friend list
- `POST /users/friends/request/:userId`
- `POST /users/friends/request/:userId/accept`
- `POST /users/friends/request/:userId/reject`
- `DELETE /users/friends/:userId`

### Posts

- `GET /posts`
- `POST /posts` - multipart upload with optional `media[]`
- `POST /posts/:postId/like`
- `POST /posts/:postId/comments`
- `DELETE /posts/:postId`

### Stories

- `GET /stories`
- `GET /stories/friends`
- `POST /stories` - multipart upload with `media`

### Messages / Conversations

- `GET /messages/unread/count`
- `GET /messages/:userId`
- `POST /messages/:userId` - optional chat attachment
- `PATCH /messages/:messageId/seen`
- `GET /conversations`

### Notifications

- `GET /notifications`
- `GET /notifications/unread/count`
- `PATCH /notifications/read-all`

## Socket.IO Events

### Client emits

- `conversation:join` `{ userId }`
- `typing` `{ receiverId }`
- `stop-typing` `{ receiverId }`
- `message:send` `{ receiverId, text, attachment? }`
- `message:seen` `{ messageId }`

### Server emits

- `users:online` `User[]`
- `typing` `{ userId }`
- `stop-typing` `{ userId }`
- `message:new` `{ message }`
- `message:seen` `{ messageId, seen, by }`
- `notification:new` `notification`

## Data Model Highlights

- `User`: auth fields, avatar, cover photo, bio, friends, friend request state
- `Post`: user, content, media URLs, likes, comments
- `Story`: user, media URL, `expiresAt` with TTL auto-delete
- `Conversation`: members, last message
- `Message`: sender/receiver, text/media, attachment metadata, seen status
- `Notification`: recipient, sender, type, optional post reference, read status

## Environment Variables

Create `Backend/.env` with at least:

- `PORT` (optional; defaults to `5000`)
- `MONGO_URI` (or `MONGODB_URI`)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (optional; default `15m`)
- `JWT_REFRESH_EXPIRES_IN` (optional; default `7d`)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLIENT_ORIGIN` (recommended for Socket.IO CORS)

Create `Frontend/.env` (see `Frontend/.env.example`):

- `VITE_API_BASE_URL` (example: `http://localhost:5000/api`)
- `VITE_SOCKET_URL` (optional; example: `http://localhost:5000`)

## Local Development

## 1) Install dependencies

From each project:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

## 2) Run backend

```bash
cd Backend
npm run dev
```

Server starts at `http://localhost:5000` by default.

## 3) Run frontend

```bash
cd Frontend
npm run dev
```

Vite default is `http://localhost:5173`.

## Build / Production Commands

### Frontend

- `npm run build` - production build
- `npm run preview` - serve built assets locally

### Backend

- `npm start` - run server

## File Upload Rules (Backend)

- Profile images (`avatar`, `coverPhoto`): image only, max `5MB`
- Post media (`media[]`): image only, max `5MB` each, up to 5 files
- Story media (`media`): image/video, max `20MB`
- Chat attachment (`attachment`): any file type, max `25MB`

## Authentication Flow

1. Frontend sends login/register.
2. Backend returns `accessToken`, `refreshToken`, and user data.
3. Frontend stores tokens in local storage (`authStorage`).
4. API client adds `Authorization: Bearer <accessToken>`.
5. If access token expires, client calls `/auth/refresh` and retries request.
6. Logout invalidates refresh token lineage by incrementing `tokenVersion`.

## Frontend Pages

- `LoginPage` / `RegisterPage` - authentication
- `HomeFeedPage` - stories, post composer, feed
- `ProfilePage` - profile view/edit, avatar + cover upload with preview
- `FriendsPage` - request management and suggestions
- `ChatPage` - conversations and realtime chat
- `NotificationsPage` - activity list and read handling

## Realtime Notifications and Toasts

- Backend emits `notification:new` when notification records are created.
- Frontend `AppShell` listens globally and:
  - increments notification badge
  - shows dismissible toast popup
- `NotificationsPage` listens and refreshes list automatically.

## Troubleshooting

- `401 Not authorized`:
  - verify backend JWT secrets are set
  - confirm frontend has valid tokens in local storage
- Media upload fails:
  - confirm Cloudinary env vars
  - check file type/size against upload limits
- Socket not connecting:
  - verify `VITE_SOCKET_URL` and backend `CLIENT_ORIGIN`
  - ensure access token exists and is valid
- No notifications in real-time:
  - ensure backend socket server is running
  - confirm user is connected (logged in, app shell loaded)

## Security Notes

- Never commit real secrets (`.env`) to version control.
- Rotate JWT and Cloudinary credentials if exposed.
- Restrict CORS (`CLIENT_ORIGIN`) in production.
- Use HTTPS and secure deployment settings in production.

## Future Improvements

- Add automated tests (unit/integration/e2e)
- Add request validation layer (e.g. schema validation)
- Add pagination for posts/messages/notifications
- Add stronger role-based authorization if needed
- Add Docker and CI/CD setup

## License

No explicit license is currently defined in the repository.
#   F B - C l o n e  
 #   F B - C l o n e  
 #   F B - C l o n e  
 