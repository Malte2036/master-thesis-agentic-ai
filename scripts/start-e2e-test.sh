#!/bin/bash

# Start wiremock in the background
echo "Starting WireMock..."
docker-compose -f docker-compose.test.yml up -d wiremock

# Wait for WireMock to be healthy
echo "Waiting for WireMock to be ready..."
until curl --output /dev/null --silent --fail http://localhost:8081/__admin/health; do
  printf '.'
  sleep 1
done
echo "WireMock is up and running!"

# Run moodle-mcp with environment variables
export MOODLE_BASE_URL="http://localhost:8081"
export MOODLE_TOKEN="test-token"

echo "Starting moodle-mcp with the following environment variables:"
echo "MOODLE_BASE_URL: $MOODLE_BASE_URL"
echo "MOODLE_TOKEN: $MOODLE_TOKEN"

pnpm dev:moodle-mcp
