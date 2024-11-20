import { NextResponse } from 'next/server';
import axios from 'axios';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1h';
    const step = searchParams.get('step') || '60';

    const end = Math.floor(Date.now() / 1000);
    const start = end - parseRange(range);

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: {
        query: 'service_up',
        start,
        end,
        step,
      },
      timeout: 5000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}

function parseRange(range: string): number {
  const value = parseInt(range);
  const unit = range.slice(-1);

  switch (unit) {
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    case 'w':
      return value * 604800;
    case 'M':
      return value * 2592000;
    default:
      return 3600;
  }
}