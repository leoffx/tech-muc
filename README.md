# Tech MUC

A full-stack application with React Router frontend and Express backend.

## Project Structure

```
tech-muc/
├── frontend/          # React Router application
│   ├── app/          # Application routes and components
│   ├── public/       # Static assets
│   └── ...
├── backend/          # Express server
│   ├── src/          # TypeScript source files
│   └── ...
└── README.md
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend API will be available at `http://localhost:3001`

## Available Scripts

### Frontend
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server

## API Endpoints

- `GET /api/health` - Health check endpoint

## Features

### Frontend
- Server-side rendering
- Hot Module Replacement (HMR)
- TypeScript
- TailwindCSS for styling
- React Router for routing and data loading

### Backend
- Express server
- TypeScript
- Hot reload with tsx
