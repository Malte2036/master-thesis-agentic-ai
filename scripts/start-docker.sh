#!/bin/bash
set -euo pipefail

docker compose -f docker-compose.base.yml -f docker-compose.test.yml down --rmi local --volumes
docker compose -f docker-compose.moodle.yml -f docker-compose.base.yml -f docker-compose.yml down --rmi local --volumes

docker compose -f docker-compose.moodle.yml -f docker-compose.base.yml -f docker-compose.yml up --build -d --force-recreate --wait