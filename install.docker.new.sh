#!/bin/bash

set -e

export NODE_OPTIONS="--openssl-legacy-provider --no-experimental-fetch"

echo "Node Version: $(node -v)"
echo "cURL Version: $(curl --version | head -n 1)"
echo "Docker Version: $(docker -v)"
echo "Docker Compose Version: $(docker compose version)"

# Disable Git-related functionality in buildx
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
export BUILDKIT_INLINE_CACHE=1
export BUILDKIT_ENABLE_LEGACY_GIT=0


if [ ! -f docker/.env ]; then
  echo "Generating .env file..."
  ENV="develop"
  echo "Preparing your keys from https://my.telegram.org/"
  read -p "Enter your TG_API_ID: " TG_API_ID
  read -p "Enter your TG_API_HASH: " TG_API_HASH
  echo
  read -p "Enter your ADMIN_USERNAME: " ADMIN_USERNAME
  read -p "Enter your PORT: " PORT
  PORT="${PORT:=4000}"
  DB_PASSWORD=$(openssl rand -hex 18)
  echo "Generated random DB_PASSWORD: $DB_PASSWORD"
  echo
  echo "ENV=$ENV" > docker/.env
  echo "PORT=$PORT" >> docker/.env
  echo "TG_API_ID=$TG_API_ID" >> docker/.env
  echo "TG_API_HASH=$TG_API_HASH" >> docker/.env
  echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> docker/.env
  export DATABASE_URL=postgresql://postgres:$DB_PASSWORD@db:5432/teledrive
  echo "DB_PASSWORD=$DB_PASSWORD" >> docker/.env
  if [ ! -d "docker/data" ]; then
    mkdir -p docker/data
    chown -R $(whoami):$(whoami) docker
    chmod -R 777 docker
  fi
  cd docker
  docker compose build teledrive
  docker compose up -d
  sleep 2
  docker compose exec teledrive yarn workspace api prisma migrate deploy
  docker run --rm --network=docker_teledrive --name=postgres-client postgres psql -h db -U postgres -c "alter user postgres with password '$DB_PASSWORD';"
  docker compose down
  docker compose up -d
else
  cd docker
  git fetch origin
  if ! git rev-parse --verify experiment >/dev/null 2>&1; then
    git branch staging origin/experiment
  fi
  git checkout staging
  export $(cat docker/.env | xargs)
  docker compose down
  docker compose up --build --force-recreate -d
  sleep 2
  docker compose exec teledrive yarn workspace api prisma migrate deploy
  docker run --rm --network=docker_teledrive --name=postgres-client postgres psql -h db -U postgres -c "alter user postgres with password '$DB_PASSWORD';"
  docker compose down
  docker compose up -d
  git reset --hard
  git clean -f
  git pull origin experiment
fi