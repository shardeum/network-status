# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
# Start all services (recommended for development)
npm run start:all    # Starts Next.js, Prometheus exporter, and monitors with nodemon

# Individual services
npm run dev          # Next.js development server (port 3000)
npm run exporter     # Prometheus metrics exporter (port 3002)
npm run prometheus   # Prometheus in Docker (port 9090)

# Production
npm run build        # Build Next.js for production
npm run start        # Start Next.js production server
docker-compose up    # Deploy all services via Docker
```

### Testing
```bash
npm run test         # Run test environment with test endpoints
```

## Architecture Overview

This is a three-tier monitoring system:

1. **Prometheus Exporter** (`server/exporter.js`): Express server that polls configured endpoints and exposes metrics
2. **Prometheus Server**: Stores time-series data (runs in Docker)
3. **Next.js Frontend** (`app/`): Displays real-time status and historical data

### Key Architectural Patterns

- **Service Configuration**: All monitored endpoints are defined in `server/endpoints.json`
- **Metrics Collection**: The exporter polls services concurrently (3 at a time) with retry logic (3 attempts, exponential backoff)
- **Alert System**: 5-minute grace period before Slack notifications to avoid alert fatigue from transient failures
- **Data Flow**: Exporter → Prometheus → Next.js API routes → React components

### Frontend Architecture

- **App Router**: Uses Next.js 14 App Router with TypeScript
- **API Routes**: Located in `app/api/` for fetching Prometheus data
- **Custom Hooks**: Reusable data fetching logic in `hooks/`
- **Component Library**: Uses shadcn/ui components in `components/ui/`
- **State Management**: React hooks for local state, no global state library

### Important Implementation Details

1. **Response Validation**: Services can define expected response structure in `endpoints.json`
2. **Downtime Tracking**: Maintains in-memory state for downtime duration and alert status
3. **Real-time Updates**: Frontend polls every second for live status
4. **Historical Data**: 30-day uptime history with daily aggregation

## Common Development Tasks

### Adding a New Service to Monitor
1. Edit `server/endpoints.json` to add the service configuration
2. Include URL, name, group, and optionally expectedResponse/body/headers
3. Restart the exporter to pick up changes

### Modifying UI Components
- Main components: `components/UptimeMonitor.tsx`, `components/LatencyMonitor.tsx`
- Use existing UI components from `components/ui/` (shadcn/ui)
- Follow the established pattern of using TypeScript interfaces in `types/`

### Working with Metrics
- Metrics are exposed at `http://localhost:3002/metrics`
- Two main metrics: `service_up` (0/1) and `service_response_time` (milliseconds)
- Prometheus queries are constructed in the API routes and hooks

### Environment Configuration
Key environment variables (set in `.env.local` for development):
- `SLACK_WEBHOOK_URL`: For downtime notifications
- `PROMETHEUS_URL`: Default is `http://localhost:9090`
- `GRACE_PERIOD_MS`: Alert delay (default: 300000ms = 5 minutes)