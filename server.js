const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5173;

// CORS headers for frontend to access backend directly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Proxy /api to backend
app.use('/api', (req, res) => {
  const http = require('http');
  const proxyReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': req.headers['accept'] || 'application/json',
      'Host': 'localhost:3000',
    },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('[PROXY ERROR]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Backend unavailable', message: err.message });
    }
  });
  
  req.on('data', (chunk) => proxyReq.write(chunk));
  req.on('end', () => proxyReq.end());
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// SPA fallback - catch-all must be after static files
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API proxy -> http://localhost:3000`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
