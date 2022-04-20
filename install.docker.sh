#!/bin/bash

set -e

echo "Node Version: $(git --version)"
echo "cURL Version: $(docker -v)"
echo "cURL Version: $(docker-compose -v)"

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

  DB_PASSWORD=$(curl https://random.justyy.workers.dev/api/random/\?cached\&n\=18\&x\=7\&_\=1649668152866 | sed 's/\"//gi')
  API_JWT_SECRET=$(curl https://random.justyy.workers.dev/api/random/\?cached\&n\=36\&x\=7\&_\=1649668152866 | sed 's/\"//gi')
  FILES_JWT_SECRET=$(curl https://random.justyy.workers.dev/api/random/\?cached\&n\=36\&x\=7\&_\=1649668152866 | sed 's/\"//gi')

  echo "ENV=$ENV" > docker/.env
  echo "PORT=$PORT" >> docker/.env
  echo "TG_API_ID=$TG_API_ID" >> docker/.env
  echo "TG_API_HASH=$TG_API_HASH" >> docker/.env
  echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> docker/.env
  echo "DB_PASSWORD=$DB_PASSWORD" >> docker/.env
  echo "API_JWT_SECRET=$API_JWT_SECRET" >> docker/.env
  echo "FILES_JWT_SECRET=$FILES_JWT_SECRET" >> docker/.env

  cd docker
  docker-compose up -d
  sleep 2
  docker-compose up -d
  docker container exec -i $(docker-compose ps -q db) psql -U postgres teledrive < ../server/src/model/migrations/dump.20220406.sql
else
  git reset --hard
  git clean -f
  git pull origin main

  export $(cat docker/.env | xargs)

  cd docker
  docker-compose down
  docker-compose up --build --force-recreate -d
  sleep 2
  docker-compose up -d

  docker image prune -f
fi
