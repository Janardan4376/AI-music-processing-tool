import React, { useState } from 'react';
import { Upload, Loader2, Music2, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const RemoveVocals = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to upload.');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setStatus('uploading');
    setError('');

    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const res = await axios.post('/api/upload', formData, config);
      
      setStatus('processing');
      
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const songsRes = await axios.get('/api/songs', { headers: { 'Authorization': `Bearer ${token}` } });
          const uploadedSong = songsRes.data.find(s => s.id === res.data.song_id);
          
          if (uploadedSong) {
             if (uploadedSong.status === 'ready') {
                clearInterval(poll);
                setProgress(100);
                setStatus('success');
                setTimeout(() => navigate('/gallery'), 2000);
             } else if (uploadedSong.status === 'error') {
                clearInterval(poll);
                setError('Processing failed. Please try again.');
                setStatus('idle');
                setUploading(false);
             } else {
                setProgress(uploadedSong.progress || 0);
             }
          }
        } catch (err) {
          console.error("Polling error", err);
          if (err.response?.status === 401) {
             clearInterval(poll);
             setError('Session expired. Please login again.');
             navigate('/');
          }
        }
      }, 3000);

    } catch (err) {
      console.error("Upload failed", err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => navigate('/'), 2000);
      } else if (err.response?.status === 413) {
        setError('File too large. Max size is 100MB.');
      } else {
        setError(err.response?.data?.error || 'Upload failed. Please check your connection.');
      }
      setStatus('idle');
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <h1 className="text-4xl font-bold mb-2 text-white">Remove Vocals</h1>
        <p className="text-slate-400 mb-10">Upload any song to isolate the instrumental track.</p>

        <div className="glass-panel p-10 border-2 border-dashed border-slate-700 hover:border-purple-500/50 transition-colors relative overflow-hidden group">
          
          {status === 'idle' && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                <Upload size={40} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Click to Upload</h3>
                <p className="text-sm text-slate-500">MP3, WAV, M4A supported (Max 50MB)</p>
              </div>
              <label className="btn btn-primary px-8 py-3 rounded-full cursor-pointer relative z-10">
                Select File
                <input type="file" className="hidden" accept="audio/*" onChange={handleUpload} />
              </label>
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex flex-col items-center gap-6">
              <Loader2 size={48} className="text-purple-500 animate-spin" />
              <h3 className="text-xl font-semibold text-white">Uploading...</h3>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                <Music2 size={48} className="text-purple-400 animate-bounce" />
              </div>
              <div className="w-full text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Processing Audio...</h3>
                <p className="text-sm text-slate-500 mb-4">Separating vocals from instrumentals.</p>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">{progress}% Complete</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Done! Redirecting...</h3>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-0 right-0 mx-auto w-max flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

        </div>
      </motion.div>

    </div>
  );
};

export default RemoveVocals;
