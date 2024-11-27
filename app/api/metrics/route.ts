import { NextResponse } from 'next/server';
import axios from 'axios';
import { subDays } from 'date-fns';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// Use 5-minute intervals for better granularity
const STEP_SIZE = 300; // 5 minutes in seconds

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = Math.floor(subDays(new Date(), 29).getTime() / 1000);

    // Query with 5-minute average
    const query = `
      avg_over_time(service_up[5m])
    `;

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: {
        query,
        start,
        end,
        step: STEP_SIZE,
      },
      timeout: 5000,
    });

    return NextResponse.json({
      status: 'success',
      data: response.data.data
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}