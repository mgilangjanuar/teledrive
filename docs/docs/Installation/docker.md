---
sidebar_position: 1
---

# Docker

Install TeleDrive with docker-compose.

## Prerequisite

Get started by installing all needed services and define all variables.

### What you'll need

- [Docker](https://www.docker.com/products/docker-desktop/) version 4.6.1 or above
- Define all .env variables in `./docker/.env`, you can copy from `./docker/.env.example`

  ```shell
  cp ./docker/.env.example ./docker/.env
  ```

  Explanation:

  | env                    | required | description                                                       |
  | ---------------------- | -------- | ----------------------------------------------------------------- |
  | NPM_TOKEN              | yes      | Your [GitHub personal token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with [these permissions](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages#about-scopes-and-permissions-for-package-registries) |
  | ENV                    | no       | Hide the logs for production, default: develop                    |
  | TG_API_ID              | yes      | Application ID from your Telegram App                             |
  | TG_API_HASH            | yes      | Application hash from Telegram App                                |
  | DB_PASSWORD            | yes      | Database password                                                 |
  | API_JWT_SECRET         | yes      | Random string for encrypt JWT web token                           |
  | FILES_JWT_SECRET       | yes      | Random string for encrypt public files                            |
  | REACT_APP_TG_API_ID    | yes      | Application ID from your Telegram App *(for experimental features)* |
  | REACT_APP_TG_API_HASH  | yes      | Application hash from Telegram App  *(for experimental features)*   |

## Build and Run

Build and run with this command:

```shell
docker-compose -f docker/docker-compose.yml up

# or with -d for make it daemon
docker-compose -f docker/docker-compose.yml up -d
```

Done! You can now open [teledrive.localhost](http://teledrive.localhost) or [localhost:4000](http://localhost:4000) in your browser 🎊

View the app logs with this command:

```shell
docker-compose -f docker/docker-compose.yml logs app --follow
```

**Note.** *You need to set `ENV=develop` in the variables to logging all events.*

Stop the services by:

```shell
docker-compose -f docker/docker-compose.yml down
```


## Upgrade

Upgrade to the latest version of TeleDrive with this command:

```shell
git pull origin main   # or, staging for the latest updates

docker-compose -f docker/docker-compose.yml up -d --build app
```

## Common Issues

- *App not running after I run `up -d`*

  Try to up the services again with command:

  ```shell
  docker-compose -f docker/docker-compose.yml up -d
  ```

Next, you need to reverse proxy the application to your domain with [Nginx](/docs/deployment/nginx).