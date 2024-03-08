import { Request, Response } from 'express';
const express = require('express');
const cors = require('cors')
const prometheus = require('prom-client');
const Health = require('./services/health');
const app = express();

app.use(cors());

const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req: Request, res: Response) => {
  console.log('GET /metrics');
  try {
    const metrics = await prometheus.register.metrics();
    res.set('Content-Type', prometheus.register.contentType);
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
});


Health.check();

interface Service {
  name: string;
  status: number;
}


app.listen(3002, () => {
  console.log('Server started on http://localhost:3002');
});

