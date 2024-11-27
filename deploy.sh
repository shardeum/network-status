#!/bin/bash

# deploy.sh
set -e

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Function to check disk space
check_disk_space() {
    echo "📊 Checking disk space..."
    FREE_SPACE=$(df -k / | awk '{print $4}' | tail -n 1)
    MIN_SPACE=5242880  # 5GB in KB
    
    if [ "$FREE_SPACE" -lt "$MIN_SPACE" ]; then
        echo "⚠️ Low disk space detected. Cleaning up..."
        docker system prune -f
        
        # Check again after cleanup
        FREE_SPACE=$(df -k / | awk '{print $4}' | tail -n 1)
        if [ "$FREE_SPACE" -lt "$MIN_SPACE" ]; then
            echo "❌ Not enough disk space available. Please free up at least 5GB."
            exit 1
        fi
    fi
}

# Function to backup current state
backup_current_state() {
    echo "📦 Backing up current state..."
    mkdir -p "$BACKUP_DIR"
    cp $DOCKER_COMPOSE_FILE "$BACKUP_DIR/"
    docker-compose config > "$BACKUP_DIR/docker-compose.resolved.yml"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping current services..."
    docker-compose down || true
}

# Function to deploy new version
deploy_new_version() {
    echo "🚀 Deploying new version..."
    docker-compose pull
    docker-compose build --no-cache || return 1
    docker-compose up -d || return 1
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    sleep 10  # Wait for services to initialize
    
    # Check if all services are running
    if ! docker-compose ps | grep -q "Exit"; then
        return 0
    else
        echo "❌ Some services failed to start"
        docker-compose logs
        return 1
    fi
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

check_disk_space
backup_current_state
stop_services

if deploy_new_version && verify_deployment; then
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