const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); 
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const barcodeRoutes = require('./routes/barcodeRoutes');
const encoderRoutes = require('./routes/encoderRoutes');
const heicConverterRoutes = require('./routes/heicConverter');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const session = require('express-session');
const sessionMiddleware = require('./middleware/session');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhooks');
const subscriptionRoutes = require('./routes/subscription');




dotenv.config();

// Handle unhandled promise rejections - prevent server crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions - log and exit gracefully
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Shared store for compress PDF download tokens (same process). Merge PDF uses qrService.
if (typeof global !== 'undefined' && !global.downloadTokens) {
  global.downloadTokens = new Map();
}

const app = express();

// Security: Helmet - set secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid breaking external scripts/ads
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting - prevent abuse and DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // requests per window
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Stricter rate limit for auth endpoints (applied in routes via separate limiter if needed)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 min
  message: { success: false, error: 'Too many attempts. Please try again later.' }
});

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
    ];

app.use(cors({
  origin: corsOrigins.length ? corsOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With','Cache-Control',   
    'Pragma',           
    'Accept'  ],
   exposedHeaders: ['set-cookie']
}));


app.use(cookieParser());

app.use(sessionMiddleware);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL?.startsWith('https'),
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax'
  } 
  })
);

app.use(morgan(':date[clf] ":method :url" :status :response-time ms'));

// Apply stricter rate limit to auth routes
app.use('/api/register', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/forgot-password', authLimiter);

// Test database connection
testConnection();

// Add a test endpoint at the root to verify server is working
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to iLoveConversion API',
    endpoints: {
      test: 'GET /api/test',
      register: 'POST /api/register',
      login: 'POST /api/login',
      users: 'GET /api/users'
    },
    server: {
      host: req.headers.host,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }
  });
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API server is working!',
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
    headers: req.headers
  });
});

const userRoutes = require('./routes/userRoutes');
const developerRoutes = require('./routes/developerRoutes');
const codeDiffRoutes = require('./routes/codeDiffRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const designRoutes = require('./routes/designRoutes');
const colorRoutes = require('./routes/colorRoutes');
const notFoundHandler = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

app.use('/api', userRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/code-diff', codeDiffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/encoder', encoderRoutes);
app.use('/api/colors', colorRoutes);   
app.use('/api/design', designRoutes); 
app.use('/api/heic', heicConverterRoutes);
app.use('/api', paymentRoutes);
app.use('/api', webhookRoutes);
app.use('/api', subscriptionRoutes);






// 404 - Must be after all valid routes
app.use(notFoundHandler);

// Centralized error handling - catches all errors from routes
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running!`);
  console.log(`📡 Accessible at:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://192.168.18.101:${PORT}`);
  console.log(`   Network:  http://192.168.18.62:${PORT}`);
  console.log(`   All IPs:  http://0.0.0.0:${PORT}`);
  console.log(`\n📚 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`\n📝 Registration endpoint:`);
  console.log(`   POST http://localhost:${PORT}/api/register`);
});