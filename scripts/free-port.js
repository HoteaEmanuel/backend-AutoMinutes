const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPort() {
  if (process.env.PORT) return process.env.PORT;
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(/^PORT=(\d+)/m);
    if (match) return match[1];
  }
  return '3000';
}

const port = getPort();

try {
  if (process.platform === 'win32') {
    const output = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
      encoding: 'utf8',
    });
    const pids = new Set(
      output
        .split('\n')
        .map((line) => line.trim().split(/\s+/).pop())
        .filter(Boolean),
    );
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[free-port] Killed leftover process ${pid} on port ${port}`);
      } catch {
        // process may have already exited
      }
    }
  } else {
    const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
    const pids = output.split('\n').map((p) => p.trim()).filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`[free-port] Killed leftover process ${pid} on port ${port}`);
      } catch {
        // process may have already exited
      }
    }
  }
} catch {
  // no process found on the port, nothing to do
}
