import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await axios.post(endpoint, { username, password });
      
      login(response.data.token, response.data.username);
      navigate('/admin/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Authentication failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="admin-login-container">
      <div className="login-form">
        <h2>{isRegistering ? 'Create Admin Account' : 'Admin Login'}</h2>
        <p className="login-subtitle">
          Access the FriendBot control center
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? 'Loading...' : isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="switch-mode">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="switch-btn"
          >
            {isRegistering 
              ? 'Already have an account? Login' 
              : 'Need an account? Register'}
          </button>
        </div>

        <div className="back-to-chat">
          <a href="/">← Back to Chat</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;