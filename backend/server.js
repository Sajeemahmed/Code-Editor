const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL || 'https://code-editor-byme.netlify.app', // ✅ no trailing slash
        'https://your-custom-domain.com'
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL
      ],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    node_version: process.version
  });
});

// Temp directory for non-cloud environments
const tempDir = path.join(__dirname, 'temp');
if (!process.env.VERCEL && !process.env.RENDER && !process.env.NETLIFY) {
  fs.ensureDirSync(tempDir);
}

// Route handling
try {
  const executeRouter = require('./routes/execute');
  app.use('/api/execute', executeRouter);
} catch (error) {
  console.error('Error loading execute routes:', error);
  app.use('/api/execute', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Route loading failed',
      details: error.message
    });
  });
}

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Platform: ${process.platform}`);
  console.log(`📁 Temp directory: ${process.env.VERCEL || process.env.RENDER || process.env.NETLIFY ? '/tmp' : tempDir}`);

  // Check compiler availability
  const checkCommand = (cmd) => {
    exec(`${cmd} --version`, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${cmd}: Not available`);
      } else {
        console.log(`✅ ${cmd}: Available`);
      }
    });
  };

  setTimeout(() => {
    console.log('🔍 Checking available compilers...');
    checkCommand('node');
    checkCommand('python3');
    checkCommand('python');
    checkCommand('javac');
    checkCommand('java');
    checkCommand('g++');
    checkCommand('gcc');
  }, 1000);
});
