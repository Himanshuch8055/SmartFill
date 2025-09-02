# SmartFill Chrome Extension (MERN + Tailwind)

This repository contains a Chrome Extension frontend (Manifest V3) powered by React + Vite + Tailwind CSS, and a backend server built with Express and MongoDB.

## Structure

- `extension/` — Chrome extension UI and scripts (React + Vite + Tailwind + CRX plugin)
- `server/` — Backend API (Express + MongoDB)

## Prerequisites

- Node.js 18+
- npm or pnpm or yarn
- MongoDB connection string (if using the backend)

## Getting Started

### 1) Frontend (Chrome Extension)

```bash
cd extension
npm install
npm run dev
```

This serves the extension in dev mode. Use CRX DevServer instructions printed in the terminal to load the extension in Chrome during development. For a production build:

```bash
npm run build
```

The built extension will be in `extension/dist/` where you can load it via `chrome://extensions` (Enable Developer Mode → Load unpacked).

### 2) Backend (API Server)

```bash
cd server
npm install
cp .env.example .env  # update values
npm run dev
```

The server starts at `http://localhost:5000` by default.

## Notes

- Tailwind is already configured for the extension. Use classes directly in React components.
- Update `server/.env` with your MongoDB URI when ready.
- You'll provide feature details later; this scaffold is ready to extend on both ends.
