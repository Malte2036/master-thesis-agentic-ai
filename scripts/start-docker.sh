#!/bin/bash
set -euo pipefail

# Default to development environment
ENVIRONMENT=${1:-development}

# Validate environment parameter
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "test" ]]; then
    echo "Error: Environment must be 'development' or 'test'"
    echo "Usage: $0 [development|test]"
    echo "  development: Starts full stack with Moodle (default)"
    echo "  test: Starts test environment with Wiremock"
    exit 1
fi

echo "Starting Docker environment: $ENVIRONMENT"

# Clean up all existing containers regardless of environment
echo "Cleaning up existing containers..."
docker compose -f docker-compose.base.yml -f docker-compose.test.yml down --rmi local --volumes
docker compose -f docker-compose.moodle.yml -f docker-compose.base.yml -f docker-compose.yml down --rmi local --volumes

if [[ "$ENVIRONMENT" == "development" ]]; then
    export NODE_ENV=development
    echo "Starting development environment with Moodle..."
    docker compose -f docker-compose.moodle.yml -f docker-compose.base.yml -f docker-compose.yml up --build -d --force-recreate --wait
    
elif [[ "$ENVIRONMENT" == "test" ]]; then
    export NODE_ENV=test
    echo "Starting test environment with Wiremock..."
    docker compose -f docker-compose.base.yml -f docker-compose.test.yml up --build -d --force-recreate --wait
fi

echo "Docker environment '$ENVIRONMENT' started successfully!"