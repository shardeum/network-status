const express = require('express');
const client = require('prom-client');
const axios = require('axios');
const endpoints = require(process.env.ENDPOINTS_FILE || './endpoints.json');

const app = express();
const register = new client.Registry();

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Create metrics
const serviceUptime = new client.Gauge({
  name: 'service_up',
  help: 'Service availability status (1 for up, 0 for down)',
  labelNames: ['service_name', 'group', 'url']
});

const serviceResponseTime = new client.Gauge({
  name: 'service_response_time',
  help: 'Service response time in milliseconds',
  labelNames: ['service_name', 'group', 'url']
});

register.registerMetric(serviceUptime);
register.registerMetric(serviceResponseTime);

// Axios instance with retry logic
const axiosInstance = axios.create({
  timeout: 10000,
  validateStatus: function (status) {
    return status >= 200 && status < 600;
  },
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkServiceStatus(service, group) {
  let lastError = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const startTime = Date.now();
      
      const config = {
        ...(service.body && { method: 'POST', data: service.body }),
        headers: {
          'User-Agent': 'ServiceMonitor/1.0',
          'Accept': '*/*',
          ...(service.headers || {})
        }
      };

      const response = await axiosInstance(service.url, config);
      const responseTime = Date.now() - startTime;
      
      // Record response time regardless of status
      serviceResponseTime.set(
        { service_name: service.name, group, url: service.url },
        responseTime
      );
      
      if (response.status >= 200 && response.status < 300) {
        if (service.expectedResponse) {
          if (typeof service.expectedResponse === 'string') {
            const isValid = response.data.includes(service.expectedResponse);
            serviceUptime.set(
              { service_name: service.name, group, url: service.url },
              isValid ? 1 : 0
            );
          } else {
            const isValid = Object.keys(service.expectedResponse).every(key => 
              response.data.hasOwnProperty(key)
            );
            serviceUptime.set(
              { service_name: service.name, group, url: service.url },
              isValid ? 1 : 0
            );
          }
        } else {
          serviceUptime.set(
            { service_name: service.name, group, url: service.url },
            1
          );
        }
        return;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt + 1}/${MAX_RETRIES} failed for ${service.name}: ${error.message}`);
      
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }
    }
  }

  console.error(`Service ${service.name} is down after ${MAX_RETRIES} attempts:`, lastError.message);
  // Set a high response time to indicate failure
  serviceResponseTime.set(
    { service_name: service.name, group, url: service.url },
    10000
  );
  serviceUptime.set(
    { service_name: service.name, group, url: service.url },
    0
  );
}

async function checkAllServices() {
  const CONCURRENT_CHECKS = 3;
  const services = endpoints.urls.flatMap(group => 
    group.servers.map(server => ({ ...server, group: group.group }))
  );

  for (let i = 0; i < services.length; i += CONCURRENT_CHECKS) {
    const batch = services.slice(i, i + CONCURRENT_CHECKS);
    await Promise.all(
      batch.map(service => checkServiceStatus(service, service.group))
    );
    
    if (i + CONCURRENT_CHECKS < services.length) {
      await sleep(500);
    }
  }
}

// Initialize metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Start server
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Exporter running on port ${port}`);
  
  // Start checking services
  checkAllServices();
  setInterval(checkAllServices, 60000);
});