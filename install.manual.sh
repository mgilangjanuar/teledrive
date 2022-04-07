#!/bin/bash

if [ ! -f server/.env ]
then
  echo "Generating server/.env file..."

  ENV="develop"

  echo "Preparing your keys from https://my.telegram.org/"
  read -p "Enter your TG_API_ID: " TG_API_ID
  read -p "Enter your TG_API_HASH: " TG_API_HASH

  echo
  read -p "Enter your ADMIN_USERNAME: " ADMIN_USERNAME
  read -p "Enter your DATABASE_URL: " DATABASE_URL
  read -p "Enter your PORT: [4000]" PORT
  PORT="${PORT:=4000}"

  API_JWT_SECRET=$(openssl rand -base64 36)
  FILES_JWT_SECRET=$(openssl rand -base64 36)

  echo "ENV=$ENV" > server/.env
  echo "PORT=$PORT" >> server/.env
  echo "TG_API_ID=$TG_API_ID" >> server/.env
  echo "TG_API_HASH=$TG_API_HASH" >> server/.env
  echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> server/.env
  echo "DATABASE_URL=$DATABASE_URL" >> server/.env
  echo "API_JWT_SECRET=$API_JWT_SECRET" >> server/.env
  echo "FILES_JWT_SECRET=$FILES_JWT_SECRET" >> server/.env
fi

if [ ! -f web/.env ]
then
  export $(cat server/.env | xargs)
  echo
  echo "Generating web/.env file..."

  read -p "Enter your REACT_APP_API_URL: [http://localhost:4000] " REACT_APP_API_URL
  REACT_APP_API_URL="${REACT_APP_API_URL:=http://localhost:4000}"

  echo "REACT_APP_API_URL=$REACT_APP_API_URL" > web/.env
  echo "REACT_APP_TG_API_ID=$TG_API_ID" >> web/.env
  echo "REACT_APP_TG_API_HASH=$TG_API_HASH" >> web/.env
fi

export $(cat web/.env | xargs)

echo
echo "Install dependencies..."
yarn install

echo
echo "Build..."
yarn workspaces run build

echo
echo "Run server..."
cd server && node dist/index.js