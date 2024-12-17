const express = require('express');
const client = require('prom-client');
const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const endpoints = require(process.env.ENDPOINTS_FILE || './endpoints.json');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

console.log('[CONFIG] Environment loaded:', {
  hasSlackWebhook: !!SLACK_WEBHOOK_URL,
  webhookLength: SLACK_WEBHOOK_URL?.length || 0
});

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

// service state tracking
const serviceStates = new Map();

class ServiceState {
  constructor(name, group, url) {
    this.name = name;
    this.group = group;
    this.url = url;
    this.isUp = true;
    this.lastStateChange = Date.now();
    this.alertSent = false;
  }

  setState(isUp) {
    if (this.isUp !== isUp) {
      const previousStateChange = this.lastStateChange;
      this.lastStateChange = Date.now();
      this.isUp = isUp;
      this.alertSent = false;
      return {
        stateChanged: true,
        downtime: isUp ? this.lastStateChange - previousStateChange : null
      };
    }
    return { stateChanged: false, downtime: null };
  }

  shouldAlert() {
    if (!this.alertSent) {
      this.alertSent = true;
      return true;
    }
    return false;
  }
}

// single service alerts 
async function sendSlackNotification(serviceInfo, isDown, error = null, downtime = null) {
  if (!SLACK_WEBHOOK_URL) {
    console.error('Slack webhook URL not configured. Please check your .env file.');
    return;
  }

  const color = isDown ? '#FF0000' : '#36A64F';
  const status = isDown ? 'DOWN' : 'RECOVERED';
  const emoji = isDown ? ':x:' : ':white_check_mark:';

  console.log(`[SLACK] Preparing notification for ${serviceInfo.name} - Status: ${status}`);

  let downtimeText = '';
  if (downtime) {
    const minutes = Math.floor(downtime / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      downtimeText = `*Downtime:* ${hours}h ${remainingMinutes}m\n`;
    } else {
      downtimeText = `*Downtime:* ${minutes}m\n`;
    }
    console.log(`[SLACK] Downtime calculated: ${downtimeText.trim()}`);
  }

  // alert message
  const message = {
    attachments: [{
      color: color,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *Service ${status}*\n` +
                  `*Service:* ${serviceInfo.name}\n` +
                  `*URL:* ${serviceInfo.url}\n` +
                  (error ? `*Error:* ${error}\n` : '') +
                  (downtimeText ? downtimeText : '') +
                  `*Time:* ${new Date().toLocaleString()}`
          }
        }
      ]
    }]
  };

  console.log(`[SLACK] Sending notification to webhook:`, {
    service: serviceInfo.name,
    status,
    error: error || 'none',
    downtime: downtimeText.trim() || 'none'
  });

  try {
    const response = await axios.post(SLACK_WEBHOOK_URL, message);
    console.log(`[SLACK] Notification sent successfully for ${serviceInfo.name}. Status: ${response.status}`);
  } catch (error) {
    console.error('[SLACK] Error sending notification:', {
      service: serviceInfo.name,
      error: error.message,
      response: error.response?.data || 'No response data',
      status: error.response?.status || 'No status code'
    });
  }
}

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
  const serviceKey = `${service.name}-${group}-${service.url}`;
  
  // Initialize service state if it doesn't exist
  if (!serviceStates.has(serviceKey)) {
    serviceStates.set(serviceKey, new ServiceState(service.name, group, service.url));
    console.log(`[SERVICE] Initialized state for ${service.name} in group ${group}`);
  }
  
  const serviceState = serviceStates.get(serviceKey);
  let lastError = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[SERVICE] Checking ${service.name} (Attempt ${attempt + 1}/${MAX_RETRIES})`);
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
      
      let isUp = false;
      if (response.status >= 200 && response.status < 300) {
        if (service.expectedResponse) {
          if (typeof service.expectedResponse === 'string') {
            isUp = response.data.includes(service.expectedResponse);
          } else {
            isUp = Object.keys(service.expectedResponse).every(key => 
              response.data.hasOwnProperty(key)
            );
          }
        } else {
          isUp = true;
        }
      }

      serviceUptime.set(
        { service_name: service.name, group, url: service.url },
        isUp ? 1 : 0
      );

      const { stateChanged, downtime } = serviceState.setState(isUp);
      
      // Send alert only if state changed and alert hasn't been sent
      if (stateChanged && serviceState.shouldAlert()) {
        console.log(`[SERVICE] State changed for ${service.name}. Current state: ${isUp ? 'UP' : 'DOWN'}`);
        await sendSlackNotification(
          { 
            name: service.name,
            group,
            url: service.url
          },
          !isUp,
          isUp ? null : 'Service response validation failed',
          downtime
        );
      }
      
      if (isUp) {
        console.log(`[SERVICE] ${service.name} is UP`);
        return;
      }
      throw new Error('Service validation failed');
      
    } catch (error) {
      lastError = error;
      console.log(`[SERVICE] Attempt ${attempt + 1}/${MAX_RETRIES} failed for ${service.name}: ${error.message}`);
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY * (attempt + 1);
        console.log(`[SERVICE] Waiting ${delay}ms before next retry for ${service.name}`);
        await sleep(delay);
        continue;
      }
    }
  }

  console.error(`Service ${service.name} is down after ${MAX_RETRIES} attempts:`, lastError.message);
  
  // set service response time to 10 seconds to indicate service is down
  serviceResponseTime.set(
    { service_name: service.name, group, url: service.url },
    10000
  );
  serviceUptime.set(
    { service_name: service.name, group, url: service.url },
    0
  );

  const { stateChanged, downtime } = serviceState.setState(false);
  
  // Send alert only if state changed and alert hasn't been sent
  if (stateChanged && serviceState.shouldAlert()) {
    await sendSlackNotification(
      {
        name: service.name,
        group,
        url: service.url
      },
      true,
      lastError.message,
      downtime
    );
  }
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