const { spawn, exec } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (!stdout) return resolve();
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      const listeningLines = lines.filter((line) => line.includes('LISTENING'));
      if (listeningLines.length === 0) return resolve();

      const pids = [...new Set(
        listeningLines
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && pid !== '0')
      )];

      if (pids.length === 0) return resolve();

      console.log(`  Cleaning port :${port} (PID: ${pids.join(', ')})...`);
      let remaining = pids.length;
      for (const pid of pids) {
        exec(`taskkill /F /T /PID ${pid}`, () => {
          remaining--;
          if (remaining <= 0) resolve();
        });
      }
    });
  });
}

async function main() {
  console.log('\n============================================================');
  console.log('🚀 RoomSync — Starting All Services in One Command');
  console.log('============================================================');
  console.log('Checking and freeing ports (3000, 5000, 5173, 8081)...');

  const ports = [3000, 5000, 5173, 8081];
  for (const port of ports) {
    await killProcessOnPort(port);
  }

  // Small delay to allow Windows to fully release socket handles
  await new Promise((r) => setTimeout(r, 600));

  console.log('\nLaunching sub-projects:');
  console.log('  ➜  [Backend API]       http://localhost:3000');
  console.log('  ➜  [Admin Dashboard]   http://localhost:5173');
  console.log('  ➜  [Frontend Mobile]   http://localhost:8081');
  console.log('  ➜  [Web Preview]       http://localhost:5000');
  console.log('------------------------------------------------------------');
  console.log('🔑 Demo Login Account:');
  console.log('   Email:    ava.carter@university.edu');
  console.log('   Password: 123456');
  console.log('============================================================\n');

  const children = [];

  function spawnProcess(name, args, cwd) {
    const proc = spawn('npm', args, {
      cwd,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true' }
    });

    children.push({ name, proc });

    proc.on('exit', (code) => {
      if (code && code !== 0) {
        console.log(`\n[${name}] exited with code ${code}`);
      }
    });

    return proc;
  }

  // 1. Backend (Express + SQLite + Socket.IO)
  spawnProcess('Backend', ['--prefix', path.join(PROJECT_ROOT, 'backend'), 'run', 'dev'], PROJECT_ROOT);

  // 2. Admin (Vite + React)
  spawnProcess('Admin', ['--prefix', path.join(PROJECT_ROOT, 'admin'), 'run', 'dev'], PROJECT_ROOT);

  // 3. Frontend (React Native + Expo Router)
  spawnProcess('Frontend', ['--prefix', path.join(PROJECT_ROOT, 'frontend'), 'run', 'start', '--', '--clear'], PROJECT_ROOT);

  // 4. Web Preview (Serve preview on port 5000)
  spawnProcess('Web Preview', ['--prefix', PROJECT_ROOT, 'run', 'preview'], PROJECT_ROOT);

  let isCleaningUp = false;
  function cleanup() {
    if (isCleaningUp) return;
    isCleaningUp = true;
    console.log('\n🛑 Shutting down all services...');
    for (const { name, proc } of children) {
      try {
        if (proc.pid) {
          exec(`taskkill /F /T /PID ${proc.pid}`);
        }
      } catch (e) {}
    }
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Keep event loop alive while child processes are running
  setInterval(() => {}, 10000);
}

main().catch((err) => {
  console.error('Failed to start development servers:', err);
  process.exit(1);
});
