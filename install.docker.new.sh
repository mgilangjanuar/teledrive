#!/bin/bash

set -e

echo "Node Version: $(node -v)"
echo "cURL Version: $(curl --version | head -n 1)"
echo "Docker Version: $(docker -v)"
echo "Docker Compose Version: $(docker compose version)"


if [ ! -f docker/.env ]
then
  echo "Generating .env file..."

  ENV="develop"

  echo "Preparing your keys from https://my.telegram.org/"
  read -p "Enter your TG_API_ID: " TG_API_ID
  read -p "Enter your TG_API_HASH: " TG_API_HASH

  echo
  read -p "Enter your ADMIN_USERNAME: " ADMIN_USERNAME
  read -p "Enter your PORT: " PORT
  PORT="${PORT:=4000}"

  DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'));")

  echo "ENV=$ENV" > docker/.env
  echo "PORT=$PORT" >> docker/.env
  echo "TG_API_ID=$TG_API_ID" >> docker/.env
  echo "TG_API_HASH=$TG_API_HASH" >> docker/.env
  echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> docker/.env
  export DATABASE_URL=postgresql://postgres:$DB_PASSWORD@db:5432/teledrive
  echo "DB_PASSWORD=$DB_PASSWORD" >> docker/.env

  cd docker
  docker compose build teledrive
  docker compose up -d
  sleep 2
  docker compose exec teledrive yarn workspace api prisma migrate deploy
else
  git pull origin main

  export $(cat docker/.env | xargs)

  cd docker
  docker compose down
  docker compose up --build --force-recreate -d
  sleep 2
  docker compose up -d
  docker compose exec teledrive yarn workspace api prisma migrate deploy
  git reset --hard
  git clean -f
  git pull origin main
  fi
