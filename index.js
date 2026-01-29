const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); 
const cookieParser = require('cookie-parser');
const userTracker = require('./middleware/userTracker');
const barcodeRoutes = require('./routes/barcodeRoutes');
const encoderRoutes = require('./routes/encoderRoutes');
const heicConverterRoutes = require('./routes/heicConverter');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const session = require('express-session');


dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.18.101:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
  })
);

app.use(morgan(':date[clf] ":method :url" :status :response-time ms'));

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

app.use('/api', userRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/code-diff', codeDiffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/encoder', encoderRoutes);
app.use('/api/colors', colorRoutes);   
app.use('/api/design', designRoutes); 
app.use('/api/heic', heicConverterRoutes);



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running!`);
  console.log(`📡 Accessible at:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://192.168.18.101:${PORT}`);
  console.log(`   All IPs:  http://0.0.0.0:${PORT}`);
  console.log(`\n📚 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`\n📝 Registration endpoint:`);
  console.log(`   POST http://localhost:${PORT}/api/register`);
});