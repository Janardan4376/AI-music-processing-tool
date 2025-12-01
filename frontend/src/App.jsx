import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Home from './pages/Home';
import RemoveVocals from './pages/RemoveVocals';
import Gallery from './pages/Gallery';
import RecordSong from './pages/RecordSong';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  if (!user) return <Login />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="remove-vocals" element={<RemoveVocals />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="record" element={<RecordSong />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
