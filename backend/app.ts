import { Request, Response } from 'express';
const express = require('express');
const prometheus = require('prom-client');
const HealthChecker = require('./services/servicecheck');
const app = express();
require('dotenv').config();

const healthChecker = new HealthChecker();

const PORT = process.env.PORT || 3002;

app.get('/metrics', async (req: Request, res: Response) => {

  // healthChecker.startPeriodicChecks();
  const metrics = await prometheus.register.metrics();
  res.set('Content-Type', prometheus.register.contentType);
  res.send(metrics);
});

app.listen(PORT, () => {
  console.log('Server started on PORT ' + PORT);
});

