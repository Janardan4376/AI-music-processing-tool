import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Music2, Mic2, User, LogOut, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <div className="bg-animated" />
      
      {/* Header - Profile Only */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 pointer-events-none">
        <div className="glass-panel pointer-events-auto flex items-center gap-4 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <User size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{user?.username}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Profile</span>
          </div>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button 
            onClick={logout}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-red-400"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* Portal Target for Dynamic Header Actions - Outside Profile Section */}
        <div id="header-actions" className="pointer-events-auto ml-4" />
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-24 px-4 container mx-auto relative z-10">
        <Outlet />
      </main>

      {/* Footer - Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
        <div className="glass-panel pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <Home size={20} />
            <span className="nav-label">Home</span>
          </Link>

          <Link to="/remove-vocals" className={`nav-item ${isActive('/remove-vocals') ? 'active' : ''}`}>
            <Layers size={20} />
            <span className="nav-label">Remove Vocals</span>
          </Link>

          <Link to="/gallery" className={`nav-item ${isActive('/gallery') ? 'active' : ''}`}>
            <Music2 size={20} />
            <span className="nav-label">Gallery</span>
          </Link>

          <Link to="/record" className={`nav-item ${isActive('/record') ? 'active' : ''}`}>
            <Mic2 size={20} />
            <span className="nav-label">Record</span>
          </Link>

        </div>
      </footer>

      <style>{`
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 70px;
          padding: 0 12px;
          height: 60px;
          border-radius: 16px;
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          text-decoration: none;
        }
        
        .nav-item:hover {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ec4899;
          box-shadow: 0 0 8px #ec4899;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 600;
          margin-top: 4px;
          letter-spacing: 0.02em;
          text-align: center;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default Layout;
