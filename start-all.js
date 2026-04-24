#!/usr/bin/env node
/**
 * Unified Server - Starts backend and frontend with proxy
 * Run: node start-all.js
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;
const BASE_DIR = path.join(__dirname, 'military-adaptation-system');

let backendProcess = null;

// Wait for backend to be ready
function waitForBackend(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      if (attempt >= retries) {
        reject(new Error('Backend did not start'));
        return;
      }
      const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ Backend ready on port ${BACKEND_PORT}`);
          resolve();
        } else {
          setTimeout(() => check(attempt + 1), 1000);
        }
      });
      req.on('error', () => setTimeout(() => check(attempt + 1), 1000));
    };
    check(0);
  });
}

// Start backend
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting backend...');
    
    backendProcess = spawn('npx', ['ts-node', '--transpile-only', 'src/index.ts'], {
      cwd: path.join(BASE_DIR, 'backend'),
      stdio: 'inherit',
      env: { ...process.env },
      shell: true,
    });

    backendProcess.on('error', reject);
    backendProcess.on('exit', (code) => {
      console.log(`Backend exited with code ${code}`);
    });

    resolve(backendProcess);
  });
}

// Start frontend server
function startFrontendServer() {
  return new Promise((resolve) => {
    console.log(`🖥️  Starting frontend server on port ${FRONTEND_PORT}...`);
    
    const express = require('express');
    const app = express();

    // Proxy /api to backend
    app.use('/api', (req, res) => {
      const proxyReq = http.request({
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: 'localhost' },
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (err) => {
        res.status(502).json({ error: 'Backend unavailable' });
      });
      req.pipe(proxyReq);
    });

    // Serve static files
    app.use(express.static(path.join(BASE_DIR, 'frontend', 'dist')));

    // SPA fallback
    app.get('/{*path}', (req, res) => {
      res.sendFile(path.join(BASE_DIR, 'frontend', 'dist', 'index.html'));
    });

    const server = app.listen(FRONTEND_PORT, '0.0.0.0', () => {
      console.log(`✅ Frontend server on http://0.0.0.0:${FRONTEND_PORT}`);
      resolve(server);
    });
  });
}

// Start Cloudflare Tunnel
function startCloudflared() {
  return new Promise((resolve) => {
    console.log('☁️  Starting Cloudflare Tunnel...');
    
    const cloudflared = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${FRONTEND_PORT}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    let url = null;

    cloudflared.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        url = match[0];
        resolve(url);
      }
    });

    cloudflared.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    cloudflared.on('error', (err) => {
      console.error('Failed to start cloudflared:', err.message);
      resolve(null);
    });

    cloudflared.on('exit', (code) => {
      console.log(`Cloudflared exited with code ${code}`);
    });

    // Timeout after 20s
    setTimeout(() => {
      if (!url) {
        console.log('⏳ Tunnel starting... check /tmp/tunnel-final.log');
        resolve(null);
      }
    }, 20000);
  });
}

// Main
async function main() {
  try {
    await startBackend();
    await waitForBackend();
    await startFrontendServer();
    const url = await startCloudflared();

    if (url) {
      console.log('\n==========================================');
      console.log('✅ ALL SERVICES RUNNING!');
      console.log('==========================================');
      console.log(`🌐 URL: ${url}`);
      console.log('==========================================\n');
    }

    // Keep running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      if (backendProcess) backendProcess.kill();
      process.exit(0);
    });

    // Keep alive
    setInterval(() => {}, 1000);
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

main();
