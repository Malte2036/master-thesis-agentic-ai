#!/bin/bash
set -euo pipefail

docker compose -f docker-compose.base.yml -f docker-compose.yml down
docker compose -f docker-compose.base.yml -f docker-compose.test.yml up --build