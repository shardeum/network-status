#!/bin/bash

# deploy.sh
set -e

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup current state
backup_current_state() {
    echo "📦 Backing up current state..."
    cp $DOCKER_COMPOSE_FILE "$BACKUP_DIR/"
    docker-compose config > "$BACKUP_DIR/docker-compose.resolved.yml"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping current services..."
    docker-compose down
}

# Function to deploy new version
deploy_new_version() {
    echo "🚀 Deploying new version..."
    docker-compose pull
    docker-compose build --no-cache
    docker-compose up -d
}

# Function to rollback
rollback() {
    echo "⚠️ Rolling back to previous version..."
    docker-compose down
    git checkout new-monitor
    docker-compose up -d
}

# Main deployment
echo "Starting deployment process..."
backup_current_state

# Deploy new version
if stop_services && deploy_new_version; then
    echo "✅ Deployment successful!"
    echo "Monitor the logs with: docker-compose logs -f"
    echo "To rollback, run: ./deploy.sh rollback"
else
    echo "❌ Deployment failed!"
    rollback
    exit 1
fi

# Handle rollback command
if [ "$1" = "rollback" ]; then
    rollback
fi