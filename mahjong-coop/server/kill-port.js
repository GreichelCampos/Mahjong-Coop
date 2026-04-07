#!/usr/bin/env node
// Script para matar procesos en un puerto específico (Windows)
const { exec } = require('child_process');

const PORT = process.argv[2] || 3000;

if (process.platform === 'win32') {
  // Windows
  exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
    if (err || !stdout) {
      console.log(`✓ Puerto ${PORT} está libre`);
      return;
    }
    
    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
    if (lines.length === 0) {
      console.log(`✓ Puerto ${PORT} está libre`);
      return;
    }
    
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[4];
      if (pid) pids.add(pid);
    });
    
    pids.forEach(pid => {
      exec(`taskkill /PID ${pid} /F`, () => {
        console.log(`✓ Proceso ${pid} terminado`);
      });
    });
  });
} else {
  // Linux/Mac
  exec(`lsof -i :${PORT} | grep LISTEN | awk '{print $2}'`, (err, stdout) => {
    if (err || !stdout) {
      console.log(`✓ Puerto ${PORT} está libre`);
      return;
    }
    
    const pid = stdout.trim();
    exec(`kill -9 ${pid}`, () => {
      console.log(`✓ Proceso ${pid} terminado`);
    });
  });
}
