const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Default values for safety
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key_change_in_prod';


const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const registrationRoutes = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Proxy for Render/Vercel
app.set('trust proxy', 1);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased limit to 200
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Performance Middleware
app.use(compression());

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://tau-events.vercel.app',
  'https://tau-events.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Keep-Alive Route for Render
app.get('/api/keep-alive', (req, res) => {
  res.status(200).json({ status: 'awake', timestamp: new Date().toISOString() });
});

// Root Route to verify server is alive
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'TAU Event Management API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Prevention: Simple NoSQL Injection protection middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (let key in req.body) {
      if (key.startsWith('$')) delete req.body[key];
    }
  }
  next();
});

// Database Connection with Caching for Serverless/Render
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management';
  
  try {
    const db = await mongoose.connect(MONGO_URI, {
      dbName: 'test',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    cachedDb = db;
    console.log('✅ MongoDB connected successfully');
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

// Ensure DB is connected BEFORE routes
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('❌ Database Middleware Error:', err.message);
    res.status(500).json({ 
      message: 'Database connection failed. Please ensure MONGO_URI is set in Environment Variables.',
      error: err.message 
    });
  }
});


// Request Logger for Debugging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/registrations', registrationRoutes);

// Alias routes (Fallback if /api is missing)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  console.log(`🚫 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: `Route ${req.method} ${req.url} not found on this server.`,
    availableRoutes: ['/api/auth', '/api/events', '/api/users']
  });
});

// GLOBAL JSON ERROR HANDLER - Catch-all for any 500s
app.use((err, req, res, next) => {
  console.error('🔥 CRITICAL_ERROR:', err.message);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      message: 'CORS Blocked: Your origin is not allowed. Check your Environment Variables.',
      origin: req.headers.origin 
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Detailed error hidden' : err.stack
  });
});

// Always listen on port (Required for Render)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Keep-alive ping (Self-ping every 10 minutes)
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    setInterval(() => {
      require('https').get(`${RENDER_URL}/api/keep-alive`);
    }, 10 * 60 * 1000); // 10 minutes
  }
});

module.exports = app;

