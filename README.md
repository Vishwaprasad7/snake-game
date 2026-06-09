# 🐍 Friend Snake Game

**Turn yourself into a snake and eat your friends!** A viral, personalized snake game where your face becomes the snake head and your friend photos become food items.

![Friend Snake Game](https://img.shields.io/badge/Game-Friend%20Snake-6C63FF?style=for-the-badge&logo=gamepad&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)

## ✨ Features

- 📸 **Upload Your Face** — Drag & drop with crop, zoom, rotate
- 👥 **Add Friend Photos** — Up to 50 friends become food items
- 🎮 **5 Game Modes** — Classic, Survival, Time Attack, Chaos, AI Auto Play
- ⚡ **Power-Ups** — Speed Boost, Double Points, Magnet, Shield, Freeze
- 🔥 **Combo System** — Chain kills for x2, x3, x5, x10 multipliers
- 😂 **Funny Messages** — "Rahul was eaten 😂", "Target Destroyed 😎"
- 🏆 **Leaderboards** — Global, Weekly, Monthly rankings
- 🎖️ **Achievements** — Unlock badges and become the Snake King
- 📱 **Mobile Friendly** — Swipe controls + virtual joystick
- 🌐 **Social Sharing** — Share to WhatsApp, Instagram, download score card
- 🔐 **Auth** — Google, GitHub, Email, or Guest mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (optional, for image storage)

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Opens at `http://localhost:3000`

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```
Runs at `http://localhost:5000`

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Animations | Framer Motion |
| Game Engine | HTML5 Canvas (custom) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | Passport.js (Google, GitHub, Local) |
| Storage | Cloudinary |
| Deployment | Vercel (frontend), Render (backend) |

## 📁 Project Structure

```
snake-game/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (ParticleBackground, GlassCard)
│   │   ├── context/        # AuthContext
│   │   ├── game/           # GameEngine (Canvas rendering)
│   │   ├── hooks/          # useSoundManager
│   │   ├── pages/          # Landing, Auth, Upload, Game, Leaderboard, Profile
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # API client, constants
│   └── ...
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Passport
│   │   ├── middleware/      # Auth, Upload, Error
│   │   ├── models/         # User, Score, Friend
│   │   └── routes/         # Auth, Upload, Scores, Profile, Admin
│   └── ...
└── README.md
```

## 🎮 Game Controls

| Platform | Controls |
|----------|---------|
| Desktop | Arrow Keys or WASD |
| Mobile | Swipe gestures or virtual D-pad |
| Pause | Space bar or pause button |

## 🌈 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6C63FF` | Buttons, borders, accents |
| Secondary | `#00E5FF` | Info, links, snake glow |
| Accent | `#FF4D8D` | CTA, food borders, highlights |
| Success | `#00FF88` | Achievements, confirmations |
| Background | `#0a0e1a` | Dark navy gradient |

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
```

## 📱 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend (Render)
- Connect GitHub repo
- Set root directory to `backend`
- Build command: `npm install`
- Start command: `npm start`

## 📄 License

MIT License — build, share, and have fun! 🐍
