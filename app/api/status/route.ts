import { NextResponse } from 'next/server';
import axios from 'axios';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get latest status and latency metrics
    const [statusResponse, latencyResponse] = await Promise.all([
      axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
        params: {
          query: 'service_up',
        },
        timeout: 5000,
      }),
      axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
        params: {
          query: 'service_response_time',
        },
        timeout: 5000,
      }),
    ]);

    // Process metrics into a more usable format
    const services = new Map();

    // Process status metrics
    statusResponse.data.data.result.forEach((metric: any) => {
      const name = metric.metric.service_name;
      const group = metric.metric.group;
      const status = parseInt(metric.value[1]);

      services.set(name, {
        name,
        group,
        status,
      });
    });

    // Add latency information
    latencyResponse.data.data.result.forEach((metric: any) => {
      const name = metric.metric.service_name;
      if (services.has(name)) {
        services.get(name).latency = parseFloat(metric.value[1]);
      }
    });

    return NextResponse.json(Array.from(services.values()));
  } catch (error: any) {
    console.error('Error fetching status metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status metrics', details: error.message },
      { status: 500 }
    );
  }
}