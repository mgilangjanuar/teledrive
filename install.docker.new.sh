#!/bin/bash

set -e

# Check if configuration file exists
if [ ! -f docker/.env ]; then
  echo "Error: Configuration file not found."
  exit 1
fi

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

# If no parameters are provided, start services using Docker Compose
if [ $# -eq 0 ]; then
  # Stop and start services using Docker Compose
  docker compose down
  docker compose up --build --force-recreate -d
  sleep 2
  docker compose exec teledrive yarn workspace api prisma migrate deploy
  # Update PostgreSQL password
  DB_PASSWORD=$(openssl rand -hex 16)
  docker compose exec docker-db-1 psql -U postgres -c "ALTER USER postgres PASSWORD '${DB_PASSWORD}';"
  printf "Generated random DB_PASSWORD: %s\n" "$DB_PASSWORD"
fi

# If "update" parameter is provided, update services using Docker Compose
if [ "$1" == "update" ]; then
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
fi

# If "permissions" parameter is provided, check if the current user has permission to modify necessary directories and files
if [ "$1" == "permissions" ]; then
  if [ ! -w /var/run/docker.sock ] || [ ! -w ./docker/.env ] || [ ! -w ./docker/data ]; then
    printf "This script requires permission to modify some files and directories.\n"
    printf "Giving permission to the current user...\n"
    sudo chown -R "$(whoami)" /var/run/docker.sock ./docker/.env ./docker/data
  else
    printf "No permissions required.\n"
  fi
fi
