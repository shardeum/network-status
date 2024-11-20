const { spawn } = require('child_process');

// Store process references
const processes = [];

// Function to start a process
function startProcess(command, args, name) {
  const proc = spawn(command, args, {
    stdio: 'inherit',
    env: process.env
  });

  processes.push({ proc, name });

  proc.on('error', (err) => {
    console.error(`Error starting ${name}:`, err);
  });

  return proc;
}

// Function to cleanup processes
function cleanup() {
  console.log('Cleaning up processes...');
  processes.forEach(({ proc, name }) => {
    try {
      proc.kill();
    } catch (err) {
      console.error(`Error killing ${name}:`, err);
    }
  });
  process.exit(0);
}

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Start Prometheus exporter
startProcess('node', ['server/exporter.js'], 'exporter');

// Start Next.js
startProcess('npm', ['run', 'dev'], 'next');