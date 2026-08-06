const { spawn } = require('child_process');
const net = require('net');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function killProcessOnPort(port) {
  const exec = require('child_process').exec;
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (!stdout) return resolve();
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      const pidLine = lines.find((line) => line.includes('LISTENING'));
      if (!pidLine) return resolve();
      const pid = pidLine.trim().split(/\s+/).pop();
      if (pid && pid !== '0') {
        exec(`taskkill /F /PID ${pid}`, () => resolve());
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  const backendPort = 5000;
  const frontendPort = 8081;

  if (await isPortOpen(backendPort)) {
    await killProcessOnPort(backendPort);
  }
  if (await isPortOpen(frontendPort)) {
    await killProcessOnPort(frontendPort);
  }

  const backend = spawn('npm', ['--prefix', 'backend', 'run', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit'
  });

  const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'start', '--', '--clear'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit'
  });

  backend.on('exit', (code) => {
    if (code !== 0) frontend.kill();
    process.exit(code || 0);
  });

  frontend.on('exit', (code) => {
    backend.kill();
    process.exit(code || 0);
  });
}

main();
