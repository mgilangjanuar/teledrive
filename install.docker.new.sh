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

  DB_PASSWORD=$(openssl rand -hex 48)

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
  docker compose exec teledrive yarn workspace api prisma migrate reset
  docker compose exec teledrive yarn workspace api prisma migrate deploy

echo "If you get an error like this:

A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20220525012308_add_password_files

Database error code: 42P01

Database error:
ERROR: relation \"files\" does not exist

DbError { severity: \"ERROR\", parsed_severity: Some(Error), code: SqlState(E42P01), message: \"relation \\\"files\\\" does not exist\", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some(\"namespace.c\"), line: Some(432), routine: Some(\"RangeVarGetRelidExtended\") }

Please run the following commands to resolve the issue:

cd docker
docker compose exec teledrive yarn workspace api prisma migrate reset
docker compose exec teledrive yarn workspace api prisma migrate deploy

Only run these commands once as these commands reset the database only use for initial setup. If you have any more errors please report on github 
https://github.com/mgilangjanuar/teledrive/issues

Enjoy your deployment!
"

else
git pull origin main

export $(cat docker/.env | xargs)

cd docker
docker compose down
docker compose up --build --force-recreate -d
sleep 2
docker compose up -d
if ! docker compose exec teledrive yarn workspace api prisma migrate deploy; then
  echo "
  If you encounter the following error after deploying:
  failed to solve: error from sender: open /home/user/teledrive/docker/data: permission denied
  Please run the following commands:
  cd docker
  sudo chmod -R 777 data
  Then, you can go back to the root directory of the project with
  cd ../
  You can then start the script again, and the issue should be resolved. Note that the permissions will be reset, so you will need to perform this step every time you redeploy the docker.
  "
fi
git reset --hard
git clean -f
git pull origin main
fi
