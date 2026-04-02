# 🧠 MoodAI — Emotionally Intelligent AI Companion

AI-powered web app that detects your face & mood via webcam in real-time, chats with you through Claude (adapting its personality to your emotions), and speaks responses aloud using ElevenLabs voice synthesis.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Claude](https://img.shields.io/badge/Claude-API-blueviolet) ![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-orange) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## Features

- **🎥 Live Face Detection** — Real-time webcam face detection using TensorFlow.js (face-api.js)
- **🎭 Mood Recognition** — Detects 7 emotions: happy, sad, angry, disgusted, fearful, neutral, surprised
- **🤖 Mood-Aware Chat** — Claude adapts its personality and tone based on your detected mood
- **🔊 Voice Responses** — ElevenLabs text-to-speech reads AI responses aloud
- **📊 Mood Analytics** — Live dashboard with mood timeline charts and session distribution
- **🌙 Beautiful Dark UI** — Glassmorphism design with mood-reactive glowing borders

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Face Detection | face-api.js (TensorFlow.js) |
| AI Chat | Anthropic Claude API |
| Voice | ElevenLabs TTS API |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Deployment | Vercel |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-mood-app.git
cd ai-mood-app
npm install
```

### 2. Download Face Detection Models

```bash
npm run download-models
```

### 3. Set Up Environment Variables

Edit `.env.local` with your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

- Get Claude API key: [console.anthropic.com](https://console.anthropic.com/)
- Get ElevenLabs API key: [elevenlabs.io](https://elevenlabs.io/)
- Browse voice IDs: [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — allow camera access when prompted.

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: MoodAI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-mood-app.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID`
3. Click **Deploy**

## Project Structure

```
ai-mood-app/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page (orchestrates everything)
│   ├── globals.css             # Global styles
│   └── api/
│       ├── chat/route.ts       # Claude API endpoint
│       └── speak/route.ts      # ElevenLabs TTS endpoint
├── components/
│   ├── WebcamFeed.tsx          # Camera + face detection
│   ├── MoodDisplay.tsx         # Emotion breakdown bars
│   ├── ChatPanel.tsx           # Chat interface
│   ├── MoodHistory.tsx         # Analytics dashboard
│   └── useVoicePlayer.ts      # Audio playback hook
├── lib/
│   ├── face-detection.ts       # face-api.js wrapper
│   └── mood-types.ts           # Shared types & constants
├── public/models/              # Face detection ML models
└── scripts/download-models.mjs # Model downloader
```

## How It Works

1. **Webcam captures your face** → face-api.js runs TinyFaceDetector + expression recognition
2. **Mood is classified** into one of 7 emotions with confidence scores
3. **You type a message** → sent to Claude API with your current mood as context
4. **Claude responds** with emotionally-adaptive personality
5. **ElevenLabs speaks** Claude's response (toggleable)
6. **Analytics track** your mood over the session

## License

MIT
