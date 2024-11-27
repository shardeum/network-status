import { NextResponse } from 'next/server';
import axios from 'axios';
import { subDays } from 'date-fns';
import { PROMETHEUS_STEP } from '@/lib/constants';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = Math.floor(subDays(new Date(), 29).getTime() / 1000);

    // Get raw service_up metrics for accurate downtime calculation
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: {
        query: 'service_up',
        start,
        end,
        step: PROMETHEUS_STEP,
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