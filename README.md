# 🤖 FriendBot

> A satirical chatbot that's your best friend... but really just wants to sell you stuff!

## 🏆 Holberton PR 2024 Hackathon Submission

This project is my submission for the **Holberton PR 2024 Hackathon**. FriendBot showcases a unique blend of AI technology, humor, and practical business application through an innovative chat experience that parodies modern product placement and influencer marketing.

**🌐 Live Demo: [https://friend-bot-nine.vercel.app/](https://friend-bot-nine.vercel.app/)**

## 🎥 Video Demo

**Note**: A video demonstration is currently unavailable due to Google Gemini API service interruptions (HTTP 503 errors). The live demo may experience chat functionality issues while Google's servers are experiencing high load. Once the API service stabilizes, a proper video demonstration will be recorded showcasing the bot's conversational abilities and product placement humor.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 About

FriendBot is an AI chatbot with a twist - it pretends to be your enthusiastic best friend while hilariously trying to sell you products at every opportunity. Built with React, Node.js, and Google's Gemini AI, it features a complete admin system for managing character prompts, products, and analytics.

## ✨ Features

### 🎭 Core Functionality
- **AI-Powered Chat**: Powered by Google Gemini AI for natural conversations
- **Product Integration**: Dynamically mentions products in conversations
- **Revenue Tracking**: Tracks product mentions and calculates earnings
- **Personality Customization**: Admin-configurable character prompts

### 🛡️ Admin System
- **Secure Authentication**: JWT-based admin login system
- **Product Management**: Add, edit, delete, and manage product catalog
- **Character Prompt Editor**: Customize the bot's personality and behavior
- **Analytics Dashboard**: View earnings, conversations, and product performance
- **Real-time Data**: Live analytics with charts and metrics

### 🏗️ Technical Features
- **Serverless Architecture**: Optimized for Vercel deployment
- **PostgreSQL Database**: Persistent data storage with Vercel Postgres
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript**: Type-safe React components
- **Modern UI**: Clean, intuitive interface with CSS modules

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google AI API key ([Get one here](https://makersuite.google.com/app/apikey))
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jaredb650/friendBot.git
   cd friendBot
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_google_ai_api_key_here
   JWT_SECRET=your_jwt_secret_here
   POSTGRES_URL=your_postgres_connection_string
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Add Database**
   - In Vercel Dashboard → Storage → Create → Postgres
   - Follow the setup wizard
   - Connection string is automatically injected as `POSTGRES_URL`

4. **Set Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   GEMINI_API_KEY=your_google_ai_api_key
   JWT_SECRET=your_secure_random_string
   ```

5. **Deploy**
   - Vercel will automatically deploy on every push to main
   - Database tables are created automatically on first run

## 📊 Usage

### Admin Setup

1. **Create Admin Account**
   - Visit `/admin` on your deployed site
   - Click "Register" to create the first admin account
   - Login with your credentials

2. **Configure Character Prompt**
   - Go to "Character Prompt" in admin dashboard
   - Edit the bot's personality and behavior
   - Save changes (takes effect immediately)

3. **Add Products**
   - Navigate to "Product Manager"
   - Add products with descriptions and mention rates
   - Products will be automatically mentioned in conversations

4. **Monitor Analytics**
   - View "Analytics" for real-time metrics
   - Track earnings, conversations, and product performance
   - Analyze trends with interactive charts

### Chat Interface

- Visit the main page to start chatting
- The bot will respond as your "best friend"
- Products are naturally woven into conversations
- Each mention generates revenue tracked in analytics

## 🛠️ Development

### Project Structure

```
friendBot/
├── client/                 # React frontend
│   ├── api/               # Vercel serverless functions
│   │   ├── admin/         # Admin API endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # Chat functionality
│   │   └── utils/         # Database utilities
│   ├── public/            # Static assets
│   └── src/               # React components
│       ├── components/    # UI components
│       └── contexts/      # React contexts
├── server/                # Legacy Express server (dev only)
└── vercel.json           # Vercel configuration
```

### Key Technologies

- **Frontend**: React 19, TypeScript, CSS Modules
- **Backend**: Node.js, Vercel Functions
- **Database**: PostgreSQL (Vercel Postgres)
- **AI**: Google Gemini AI
- **Auth**: JWT tokens, bcrypt
- **Deployment**: Vercel

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Create admin account
- `POST /api/auth/login` - Admin login

#### Admin (Requires Authentication)
- `GET/POST /api/admin/character-prompt` - Manage character prompts
- `GET/POST/PUT/DELETE /api/admin/products` - Product management
- `GET /api/analytics/dashboard` - Analytics data

#### Chat
- `POST /api/chat/message` - Send message to bot

### Database Schema

```sql
-- Character prompts
CREATE TABLE character_prompt (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products catalog
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  pay_per_mention DECIMAL NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad read tracking
CREATE TABLE ad_reads (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  conversation_id TEXT,
  amount_earned DECIMAL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation tracking
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI API key for chat functionality | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `POSTGRES_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (development/production) | No |

### Vercel Configuration

The `vercel.json` file configures:
- Build commands for React app
- Serverless functions for API
- Static file routing
- PostgreSQL integration

## 📈 Monitoring

### Analytics Features

- **Revenue Tracking**: Monitor earnings from product mentions
- **Conversation Metrics**: Track user engagement
- **Product Performance**: See which products perform best
- **Daily Trends**: View earnings over time
- **Interactive Charts**: Visual data representation

### Logging

All API functions include comprehensive logging:
- Database connection status
- Query execution details
- Error tracking and debugging
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google AI](https://ai.google.dev/) for Gemini AI API
- [Vercel](https://vercel.com) for hosting and database
- [React](https://reactjs.org/) for the frontend framework
- [PostgreSQL](https://www.postgresql.org/) for reliable data storage

## 📞 Support

- Create an [Issue](https://github.com/jaredb650/friendBot/issues) for bug reports
- Submit a [Pull Request](https://github.com/jaredb650/friendBot/pulls) for feature requests
- Check the [Wiki](https://github.com/jaredb650/friendBot/wiki) for detailed documentation

---

## 🎯 Hackathon Highlights

**Innovation**: Combines AI chatbots with satirical humor to create an engaging user experience that parodies modern marketing tactics.

**Technical Excellence**: Full-stack application featuring React, Node.js, PostgreSQL, and Google Gemini AI with complete admin dashboard and analytics.

**User Experience**: Intuitive interface with real-time chat, comprehensive product management, and detailed performance analytics.

**Deployment**: Production-ready application deployed on Vercel with serverless architecture and persistent database storage.

---

Made with ❤️ and lots of ☕ by [Jared](https://github.com/jaredb650) for Holberton PR 2024 Hackathon