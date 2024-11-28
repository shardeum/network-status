import { NextResponse } from 'next/server';
import axios from 'axios';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const now = new Date();
    const end = Math.floor(now.getTime() / 1000);
    const start = Math.floor(subDays(now, 29).getTime() / 1000);

    // Single query with 5-minute resolution for better accuracy
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: {
        query: 'service_up',
        start,
        end,
        step: 300, // 5-minute intervals
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