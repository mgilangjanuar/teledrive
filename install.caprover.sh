#!/bin/bash

set -e

export NODE_OPTIONS="--openssl-legacy-provider --no-experimental-fetch"
echo "Node Version: $(node -v)"
echo "Yarn Version: $(yarn -v)"

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
   read -p "Enter your DB_PASSWORD: " DB_PASSWORD
  echo
   echo "ENV=$ENV" > docker/.env
  echo "PORT=$PORT" >> docker/.env
  echo "TG_API_ID=$TG_API_ID" >> docker/.env
  echo "TG_API_HASH=$TG_API_HASH" >> docker/.env
  echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> docker/.env
  export DATABASE_URL=postgresql://postgres:$DB_PASSWORD@db:5432/teledrive
  echo "DB_PASSWORD=$DB_PASSWORD" >> docker/.env
fi

git reset --hard
git clean -f
git pull origin staging

export $(cat docker/.env | xargs)

echo
echo "Build and deploy to CapRover..."
docker build --build-arg REACT_APP_TG_API_ID=$TG_API_ID --build-arg REACT_APP_TG_API_HASH=$TG_API_HASH -t myapp .
caprover deploy --appName myapp --imageName myapp
