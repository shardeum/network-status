const { spawn } = require('child_process');

// Store process references
const processes = [];

// Function to start a process
function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true, // Add shell option for better command compatibility
    env: { ...process.env, FORCE_COLOR: true } // Enable colored output
  });

  processes.push({ proc, name });

  proc.on('error', (err) => {
    console.error(`Error starting ${name}:`, err);
  });

  // Add exit handler to know if process fails
  proc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return proc;
}

// Function to cleanup processes
function cleanup() {
  console.log('Cleaning up processes...');
  processes.forEach(({ proc, name }) => {
    try {
      proc.kill();
      console.log(`Stopped ${name}`);
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

// Start services
console.log('Starting all services...');

// Start Prometheus exporter
startProcess('node', ['server/exporter.js'], 'exporter');

// Start Next.js using npm
startProcess('npm', ['run', 'dev'], 'next');

console.log('All services started. Press Ctrl+C to stop.');