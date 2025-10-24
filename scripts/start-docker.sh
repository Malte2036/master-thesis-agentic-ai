#!/bin/bash
set -euo pipefail

docker compose -f docker-compose.base.yml -f docker-compose.test.yml down
docker compose -f docker-compose.base.yml -f docker-compose.yml up --build