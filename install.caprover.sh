#!/bin/bash

set -e

echo "Node Version: $(node -v)"
echo "Yarn Version: $(yarn -v)"

if [ ! -f docker/.env ]
then
echo "Generating docker/.env file..."

ENV="develop"

echo "Preparing your keys from https://my.telegram.org/"
read -p "Enter your TG_API_ID: " TG_API_ID
read -p "Enter your TG_API_HASH: " TG_API_HASH

echo "ENV=$ENV" > docker/.env
echo "TG_API_ID=$TG_API_ID" >> docker/.env
echo "TG_API_HASH=$TG_API_HASH" >> docker/.env
fi

git reset --hard
git clean -f
git pull origin main

export $(cat docker/.env | xargs)

echo
echo "Build and deploy to CapRover..."
docker build --build-arg REACT_APP_TG_API_ID=$TG_API_ID --build-arg REACT_APP_TG_API_HASH=$TG_API_HASH -t myapp .
caprover deploy --appName myapp --imageName myapp