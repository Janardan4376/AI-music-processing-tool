import React, { useState, useEffect } from 'react';
import { Upload, Play, Clock, Music2, Loader2, Trash2, Search, Calendar, Mic2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Gallery = ({ user, onSongSelect }) => {
  const [songs, setSongs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSongs();
  }, [user]);

  const fetchSongs = async () => {
    try {
      const res = await axios.get('/api/songs');
      setSongs(res.data);
    } catch (err) {
      console.error("Failed to fetch songs", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await axios.post('/api/upload', formData);
      const poll = setInterval(async () => {
        const res = await axios.get('/api/songs');
        setSongs(res.data);
        const processing = res.data.some(s => s.status === 'processing');
        if (!processing) clearInterval(poll);
      }, 3000);
      setTimeout(fetchSongs, 1000);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e, songId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this song?")) return;
    try {
      await axios.delete(`/api/songs/${songId}`);
      setSongs(songs.filter(s => s.id !== songId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-md">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 style={{ marginBottom: '0.5rem' }}>Studio</h2>
          <p>Your tracks</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
          style={{ width: '100%', maxWidth: '320px' }}
        >
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '3rem' }}
          />
        </motion.div>
      </div>

      {/* Upload Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel text-center"
        style={{ padding: '2.5rem', borderStyle: 'dashed', borderWidth: '2px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-lg)' }}>
            {uploading ? (
              <Loader2 className="animate-spin" color="#8b5cf6" size={32} />
            ) : (
              <Upload color="#8b5cf6" size={32} />
            )}
          </div>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Upload Track</h3>
            <p>MP3, WAV supported</p>
          </div>
          <label className={`btn btn-primary ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ marginTop: '1rem' }}>
            {uploading ? 'Uploading...' : 'Select File'}
            <input type="file" className="hidden" accept="audio/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>
      </motion.div>

      {/* Song List */}
      <div className="grid grid-cols-3 gap-lg">
        <AnimatePresence>
          {filteredSongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div className="flex justify-between items-start" style={{ marginBottom: '1rem', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Music2 size={24} color="#94a3b8" />
                </div>
                <div className="flex items-center gap-sm">
                  <span style={{ 
                    fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '99px', fontWeight: 600, border: '1px solid',
                    backgroundColor: song.status === 'ready' ? 'rgba(34, 197, 94, 0.1)' : song.status === 'processing' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: song.status === 'ready' ? '#4ade80' : song.status === 'processing' ? '#facc15' : '#f87171',
                    borderColor: song.status === 'ready' ? 'rgba(34, 197, 94, 0.2)' : song.status === 'processing' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  }}>
                    {song.status === 'processing' ? 'Processing...' : song.status.toUpperCase()}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(e, song.id)}
                    style={{ padding: '0.5rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}
                    title="Delete Song"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={song.title}>{song.title}</h3>
              <div className="flex items-center gap-sm" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.5rem' }}>
                <Calendar size={12} />
                {new Date(song.upload_date).toLocaleDateString()}
              </div>

              <div style={{ marginTop: 'auto', position: 'relative', zIndex: 10 }}>
                {song.status === 'ready' ? (
                  <button 
                    onClick={() => onSongSelect(song)}
                    className="btn w-full"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    <Mic2 size={18} /> Start Session
                  </button>
                ) : (
                  <div style={{ width: '100%', height: '48px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Loader2 className="animate-spin" size={16} /> 
                    {song.status === 'processing' ? 'Separating Vocals...' : 'Error Processing'}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredSongs.length === 0 && !uploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel text-center"
            style={{ gridColumn: '1 / -1', padding: '5rem', color: '#64748b', borderStyle: 'dashed', borderWidth: '2px' }}
          >
            <Music2 style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.2 }} size={64} />
            <p style={{ fontSize: '1.125rem' }}>No songs found. Upload one to get started!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
