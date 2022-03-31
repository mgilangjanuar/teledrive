---
sidebar_position: 1
---

# Docker

Install TeleDrive with docker-compose.

## Prerequisite

Get started by installing all needed services and define all variables.

### What you'll need

- [Docker](https://docs.docker.com/engine/install/) version 20.10.13 or above
- [Docker compose](https://docs.docker.com/compose/install/) version 2.3.3 or above
- Define all .env variables in `./docker/.env`, you can copy from `./docker/.env.example`

  ```shell
  cp ./docker/.env.example ./docker/.env
  ```

  Explanation:

  | env                    | required | description                                                       |
  | ---------------------- | -------- | ----------------------------------------------------------------- |
  | ENV                    | no       | Hide the logs for production, default: develop                    |
  | TG_API_ID              | yes      | Application ID from your Telegram App                             |
  | TG_API_HASH            | yes      | Application hash from Telegram App                                |
  | DB_PASSWORD            | yes      | Database password                                                 |
  | API_JWT_SECRET         | yes      | Random string for encrypt JWT web token                           |
  | FILES_JWT_SECRET       | yes      | Random string for encrypt public files                            |
## Build and Run

Build and run with this command:

```shell
cd docker
docker-compose up -d
```

Done! You can now open [localhost:4000](http://localhost:4000) in your browser 🎊

View the app logs with this command:

```shell
cd docker
docker-compose logs teledrive --follow
```

**Note.** *You need to set `ENV=develop` in the variables to logging all events.*

Stop the services by:

```shell
cd docker
docker-compose down
```


## Upgrade

Upgrade to the latest version of TeleDrive with this command:

```shell
git pull origin main   # or, staging for the latest updates

cd docker
docker-compose down
docker-compose build teledrive
docker-compose up -d
```

## Common Issues

- *App not running after I run `up -d`*

  Try to up the services again with command:

  ```shell
  cd docker
  docker-compose up -d
  ```

Next, you need to reverse proxy the application to your domain with [Nginx](/docs/deployment/nginx).