import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, SkipBack, Mic2, Volume2, Save, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import LyricsDisplay from './LyricsDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const KaraokePlayer = ({ song, user, onBack }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const shouldSaveRef = useRef(false);
  const isRecordingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [volume, setVolume] = useState(1);
  const [micVolume, setMicVolume] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (song.lyrics) {
      try {
        setLyrics(JSON.parse(song.lyrics));
      } catch (e) {
        console.error("Failed to parse lyrics", e);
      }
    }

    if (containerRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'rgba(139, 92, 246, 0.3)',
        progressColor: '#8b5cf6',
        cursorColor: '#ec4899',
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
      });

      wavesurferRef.current.load(`/api/stream/${song.id}/accompaniment`);
      
      wavesurferRef.current.on('ready', () => {
        setDuration(wavesurferRef.current.getDuration());
      });

      wavesurferRef.current.on('audioprocess', () => {
        setCurrentTime(wavesurferRef.current.getCurrentTime());
      });

      wavesurferRef.current.on('finish', () => {
        setIsPlaying(false);
        if (isRecordingRef.current) {
            console.log("Song finished, auto-saving...");
            shouldSaveRef.current = true; // Auto-save when song finishes
            stopRecording();
        }
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [song]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        if (!shouldSaveRef.current) return;
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        setAudioChunks(chunks);
        
        // Save recording
        setSaving(true);
        const formData = new FormData();
        formData.append('file', blob, `recording_${song.id}_${Date.now()}.webm`);
        formData.append('song_id', song.id);
        
        try {
          await axios.post('/api/recordings', formData);
          alert('Recording saved!');
        } catch (err) {
          console.error("Failed to save recording", err);
        } finally {
          setSaving(false);
        }
      };

      // recorder.start(); // Moved to countdown finish
      // setMediaRecorder(recorder);
      // setIsRecording(true);
      
      // Unlock AudioContext immediately on user interaction
      if (wavesurferRef.current) {
        try {
            const audioContext = wavesurferRef.current.backend.getAudioContext();
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
            }
            // Hack: Play and immediately pause to "warm up" the engine and bypass autoplay policy
            // This tells the browser "the user wants to play audio"
            console.log("Warming up audio engine...");
            await wavesurferRef.current.play();
            wavesurferRef.current.pause();
            wavesurferRef.current.seekTo(0);
            console.log("Audio engine ready.");
        } catch (audioErr) {
            console.warn("Audio warm-up failed (non-fatal):", audioErr);
            // Continue anyway, as the countdown might still work or the user might want to record without backing track if it fails
        }
      }

      // Countdown logic
      console.log("Starting countdown...");
      setCountdown(3);
      let count = 3;
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        console.log("Countdown:", count);
        if (count === 0) {
          clearInterval(timer);
          setCountdown(null);
          if (wavesurferRef.current) {
            // Sync: Start instrumental and recording together
            console.log("Countdown finished, starting playback and recording");
            wavesurferRef.current.play().catch(e => console.error("Playback failed:", e));
            setIsPlaying(true);
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            isRecordingRef.current = true;
          }
        }
      }, 1000);

      // Mic visualization mock
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateMic = () => {
        if (!recorder || recorder.state === 'inactive') return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicVolume(avg);
        requestAnimationFrame(updateMic);
      };
      updateMic();

    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      shouldSaveRef.current = false; // Default to not saving (e.g. for Reset)
      mediaRecorder.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      if (wavesurferRef.current) {
        wavesurferRef.current.pause();
        setIsPlaying(false);
      }
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ minHeight: 'calc(100vh - 100px)' }}>
      {/* Background Visualizer */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center relative z-10 mb-8">
        {/* Back Button Portal */}
        {document.getElementById('header-actions') && createPortal(
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-slate-800/80 transition-all shadow-lg group"
            title="Back to Songs"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Back</span>
          </button>,
          document.getElementById('header-actions')
        )}

        <div className="text-center w-full">
          <h2 className="text-2xl font-bold text-white">{song.title}</h2>
          <p className="text-slate-400 text-sm">Karaoke Mode</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-8">
        
        {/* Lyrics Display */}
        <div className="w-full max-w-3xl h-[400px] glass-panel relative overflow-hidden flex flex-col items-center justify-center p-8">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-transparent to-slate-900/90 z-10 pointer-events-none" />
          <LyricsDisplay lyrics={lyrics} currentTime={currentTime} />
        </div>

        {/* Waveform */}
        <div className="w-full max-w-4xl glass-card p-6">
          <div ref={containerRef} className="w-full" />
          <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => {
              if (wavesurferRef.current) {
                wavesurferRef.current.stop();
                setIsPlaying(false);
                setCurrentTime(0);
                if (isRecording) stopRecording();
              }
            }}
            className="p-4 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
            title="Reset"
          >
            <RotateCcw size={24} />
          </button>

          {/* Central Record/Play Button */}
          <button 
            onClick={async () => {
              try {
                console.log("Center button clicked");
                if (isPlaying || isRecording) {
                  console.log("Stopping/Pausing...");
                  // Stop everything
                  if (wavesurferRef.current) {
                      wavesurferRef.current.pause();
                      setIsPlaying(false);
                  }
                  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                      mediaRecorder.pause(); 
                      setIsRecording(false);
                      isRecordingRef.current = false; // Paused is effectively not recording for auto-save purposes? 
                      // Actually if paused, we might want to resume. 
                      // But for auto-save on finish, if it's paused, we probably don't want to save yet?
                      // Let's keep it simple: isRecordingRef tracks active recording.
                  }
                } else {
                  console.log("Starting/Resuming...");
                  // Start or Resume
                  if (wavesurferRef.current) {
                      // If we have a recorder and it's paused, resume
                      if (mediaRecorder && mediaRecorder.state === 'paused') {
                           wavesurferRef.current.play();
                           setIsPlaying(true);
                           mediaRecorder.resume();
                           setIsRecording(true);
                           isRecordingRef.current = true;
                      } else {
                          // New session
                          await startRecording();
                      }
                  }
                }
              } catch (err) {
                console.error("Error in center button click:", err);
                alert("Error: " + err.message);
              }
            }}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105`}
            style={{
                background: isRecording ? '#ef4444' : 'linear-gradient(to top right, #9333ea, #db2777)',
                boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(168, 85, 247, 0.3)',
                transform: isRecording ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {isRecording ? <Pause size={40} color="white" fill="white" /> : <Mic2 size={40} color="white" />}
          </button>

          {/* Finish Button */}
          <button 
            onClick={() => {
                try {
                    // Stop everything and save
                    shouldSaveRef.current = true;
                    if (mediaRecorder) {
                        if (mediaRecorder.state !== 'inactive') {
                            mediaRecorder.stop(); 
                        }
                    }
                    if (wavesurferRef.current) {
                        wavesurferRef.current.stop();
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }
                    setIsRecording(false);
                    isRecordingRef.current = false;
                } catch (err) {
                    console.error("Error in finish button:", err);
                }
            }}
            className="p-4 rounded-full text-white hover:scale-105 transition-all shadow-lg"
            style={{
                backgroundColor: '#16a34a', // green-600
                boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)'
            }}
            title="Finish & Save"
          >
            <Save size={24} color="white" />
          </button>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-full">
          <Volume2 size={18} className="text-slate-400" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={volume} 
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              if (wavesurferRef.current) wavesurferRef.current.setVolume(val);
            }}
            className="w-24 accent-purple-500"
          />
        </div>

      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="text-9xl font-bold text-white drop-shadow-2xl">
              {countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-purple-500" size={48} />
            <h3 className="text-2xl font-bold text-white">Saving Recording...</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default KaraokePlayer;
