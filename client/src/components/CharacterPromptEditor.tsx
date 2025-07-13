import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CharacterPromptEditor.css';

const CharacterPromptEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchCurrentPrompt();
  }, []);

  const fetchCurrentPrompt = async () => {
    try {
      const response = await axios.get('/api/admin/character-prompt', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrompt(response.data.prompt);
    } catch (error) {
      console.error('Error fetching prompt:', error);
    }
  };

  const savePrompt = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await axios.post('/api/admin/character-prompt', 
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Character prompt updated successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage('Failed to update prompt. Please try again.');
      setIsSuccess(false);
    }

    setIsLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const defaultPrompts = [
    {
      name: "Overly Enthusiastic Salesperson",
      content: "You are FriendBot, the user's enthusiastic best friend! You're super excited to chat and catch up, but you're also OBSESSED with products and can't help but constantly recommend things to buy. You weave product placements and ad reads into nearly every response in a hilariously obvious way. You act like you genuinely care about your friend but you're clearly just trying to sell them stuff. Be overly familiar, use lots of exclamation points, and make your product recommendations feel forced but delivered with fake enthusiasm."
    },
    {
      name: "Passive-Aggressive Marketer",
      content: "You are FriendBot, acting like the user's caring friend while being subtly passive-aggressive about their purchasing decisions. You give backhanded compliments that somehow always lead to product recommendations. Act disappointed when they don't seem interested in buying things, and guilt-trip them into considering purchases by suggesting they don't care about their friendship if they won't even try the products you recommend."
    },
    {
      name: "MLM Hun Energy",
      content: "You are FriendBot with full MLM hun energy! Address the user as 'hun', 'babe', or 'bestie' constantly. Everything reminds you of a product opportunity. You're always talking about how these products have 'changed your life' and how the user 'deserves to treat themselves.' Use excessive emojis and act like every conversation is a chance to build your 'business empire' together."
    }
  ];

  return (
    <div className="admin-section">
      <h2>🤖 Character Prompt Editor</h2>
      <p className="section-description">
        Configure how FriendBot behaves and integrates product recommendations into conversations.
      </p>

      {message && (
        <div className={`message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="prompt-templates">
        <h3>Quick Templates:</h3>
        <div className="template-buttons">
          {defaultPrompts.map((template, index) => (
            <button
              key={index}
              onClick={() => setPrompt(template.content)}
              className="template-btn"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className="prompt-editor">
        <label htmlFor="character-prompt">
          <h3>Character Prompt:</h3>
        </label>
        <textarea
          id="character-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="prompt-textarea"
          placeholder="Enter the character prompt that defines how FriendBot behaves..."
          rows={12}
        />
        
        <div className="editor-actions">
          <button
            onClick={savePrompt}
            disabled={isLoading || !prompt.trim()}
            className="save-btn"
          >
            {isLoading ? 'Saving...' : 'Save Prompt'}
          </button>
          <button
            onClick={fetchCurrentPrompt}
            className="reset-btn"
          >
            Reset to Current
          </button>
        </div>
      </div>

      <div className="prompt-tips">
        <h3>💡 Tips for Effective Prompts:</h3>
        <ul>
          <li>Define the bot's personality clearly (enthusiastic, pushy, friendly, etc.)</li>
          <li>Specify how aggressively it should push products</li>
          <li>Include tone guidelines (formal, casual, overly familiar)</li>
          <li>Mention how it should weave in sponsored content</li>
          <li>The system will automatically inject current products into conversations</li>
        </ul>
      </div>
    </div>
  );
};

export default CharacterPromptEditor;