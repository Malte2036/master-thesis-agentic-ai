#!/bin/bash
set -euo pipefail

docker compose -f docker-compose.base.yml -f docker-compose.yml down --rmi local --volumes
docker compose -f docker-compose.base.yml -f docker-compose.test.yml down --rmi local --volumes

docker compose -f docker-compose.base.yml -f docker-compose.test.yml up --build -d --force-recreate --wait