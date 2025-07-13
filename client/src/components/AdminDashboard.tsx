import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CharacterPromptEditor from './CharacterPromptEditor';
import ProductManager from './ProductManager';
import Analytics from './Analytics';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, logout, username } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🎛️ FriendBot Admin Panel</h1>
        <div className="admin-info">
          <span>Welcome, {username}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-content">
        <nav className="admin-nav">
          <button
            onClick={() => navigate('/admin/character')}
            className="nav-btn"
          >
            🤖 Character Prompt
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className="nav-btn"
          >
            📦 Products
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="nav-btn"
          >
            📊 Analytics
          </button>
          <a href="/" className="nav-btn chat-link">
            💬 Back to Chat
          </a>
        </nav>

        <main className="admin-main">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/character" />} />
            <Route path="/dashboard" element={<Navigate to="/admin/character" />} />
            <Route path="/character" element={<CharacterPromptEditor />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;