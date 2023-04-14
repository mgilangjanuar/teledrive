#!/bin/bash

set -e

# Create /docker directory if it doesn't exist
if [ ! -d docker ]; then
mkdir docker
fi

# Configure Node.js and cURL
export NODE_OPTIONS="--openssl-legacy-provider --no-experimental-fetch"
printf "Node.js Version: %s\n" "$(node -v)"
printf "cURL Version: %s\n" "$(curl --version | head -n 1)"

# Check Docker and Docker Compose versions
printf "Docker Version: %s\n" "$(docker -v)"
printf "Docker Compose Version: %s\n" "$(docker compose -v)"

# Disable Git-related functionality in BuildKit
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
export BUILDKIT_INLINE_CACHE=1
export BUILDKIT_ENABLE_LEGACY_GIT=0

# Generate .env file if it doesn't exist
if [ ! -f docker/.env ]; then
printf "Generating .env file...\n"
ENV="develop"
read -p "Enter your TG_API_ID: " TG_API_ID
read -p "Enter your TG_API_HASH: " TG_API_HASH
printf "\n"
read -p "Enter your ADMIN_USERNAME: " ADMIN_USERNAME
read -p "Enter your PORT [4000]: " PORT
PORT="${PORT:-4000}"
DB_PASSWORD=$(openssl rand -hex 16)
printf "Generated random DB_PASSWORD: %s\n" "$DB_PASSWORD"
printf "ENV=%s\nPORT=%s\nTG_API_ID=%s\nTG_API_HASH=%s\nADMIN_USERNAME=%s\nDB_PASSWORD=%s\n" \
"$ENV" "$PORT" "$TG_API_ID" "$TG_API_HASH" "$ADMIN_USERNAME" "$DB_PASSWORD" > docker/.env
fi

# Check if the current user has permission to modify the necessary directories and files
if [ ! -w /var/run/docker.sock ] || [ ! -w ./docker/.env ] || [ ! -w ./docker/data ]; then
printf "This script requires permission to modify some files and directories.\n"
printf "Giving permission to the current user...\n"
sudo chown -R "$(whoami)" /var/run/docker.sock ./docker/.env ./docker/data
fi

# Build and start services using Docker Compose
cd docker
if ! git branch --list experiment >/dev/null; then
git branch experiment origin/experiment
fi
git checkout experiment
export $(grep -v '^#' docker/.env | xargs)
docker compose down
docker compose up --build --force-recreate -d
sleep 2
docker compose exec teledrive yarn workspace api prisma migrate deploy
git reset --hard
git clean -f
git pull origin experiment
