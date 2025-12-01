# AI-powered music processing

A powerful AI-powered music processing tool that separates vocals from instrumentals, displays synchronized lyrics, and allows users to record their own karaoke versions with professional audio effects.

## 🚀 Features

- **AI Vocal Separation**: Uses **Demucs** (Deep Music Source Separation) to isolate vocals and instrumentals from any song with high precision.
- **Synchronized Lyrics**: Automatically extracts and aligns lyrics using **OpenAI Whisper**, displaying them line-by-line during playback.
- **Recording**: Record your voice over the instrumental track.
- **Professional Audio Processing**:
    - **Denoising**: Removes background noise from vocal recordings.
    - **Mixing**: Automatically mixes your vocal recording with the instrumental track.
    - **Audio Effects**: Applies high-pass filters and dynamic audio normalization for studio-quality sound.
- **User Gallery**: Save, manage, and playback your processed songs and recordings.
- **Modern UI**: A responsive, animated interface built with React, TailwindCSS, and Framer Motion.

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite / PostgreSQL (via SQLAlchemy)
- **AI Models**: 
    - `Demucs` (Music Separation)
    - `OpenAI Whisper` (Lyrics Transcription)
- **Audio Processing**: `FFmpeg`, `ffmpeg-python`
- **Authentication**: Flask-JWT-Extended

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Audio Visualization**: Wavesurfer.js
- **HTTP Client**: Axios

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Python 3.8+**
- **Node.js & npm**
- **FFmpeg** (Required for audio processing)
    - *Mac*: `brew install ffmpeg`
    - *Windows*: [Download FFmpeg](https://ffmpeg.org/download.html) and add to PATH.
    - *Linux*: `sudo apt install ffmpeg`

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Janardan4376/AI-music-processing-tool.git
   cd AI-music-processing-tool
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## 🚀 Running the Application

You can start both the backend and frontend services using the provided script:

```bash
./run.sh
```

Or run them manually:

**Backend:**
```bash
cd backend
source venv/bin/activate
python3 app.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
