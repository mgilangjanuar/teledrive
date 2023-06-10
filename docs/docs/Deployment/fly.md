---
sidebar_position: 5
---

# Fly.io

For deployment to [Fly.io](https://fly.io/) you need to create an account first.

## Deployment (manual)

- Install [flyctl](https://fly.io/docs/getting-started/installing-flyctl/)

- Login from flyctl in terminal:

  ```shell
  flyctl auth login
  ```

- Clone the repository to your local machine and point to the local directory:

  ```shell
  git clone https://github.com/mgilangjanuar/teledrive && cd teledrive
  ```

- Create a new app:

  ```shell
  flyctl launch
  ```

- After you create a new app, you will be asked several questions like this:
  
    ```shell
    Would you like to copy its configuration to the new app? [y/N]: y
    Scanning source code
    Detected a NodeJS app
    Choose an app name (leaving blank will default to 'tldrive'): your-app-name

    Would you like to set up a Postgresql database now? (y/N): y
    Select configuration:  [Use arrows to move, type to filter]
      > Development - Single node, 1x shared CPU, 256MB RAM, 1GB disk
      Production (High Availability) - 3 nodes, 2x shared CPUs, 4GB RAM, 40GB disk
      Production (High Availability) - 3 nodes, 4x shared CPUs, 8GB RAM, 80GB disk
    Scale single node pg to zero after one hour? (y/N) n
    Creating postgres cluster in organization laguzona-gmail-com
    Creating app...
    Setting secrets on app your-app-name-db...
    Provisioning 1 of 1 machines with image flyio/postgres-flex:15.3@sha256:c380a6108f9f49609d64e5e83a3117397ca3b5c3202d0bf0996883ec3dbb80c8
    ## after this, you will see your database credentials, save it for later use.

    Would you like to set up an Upstash Redis database now? (y/N): y
    ? Select an Upstash Redis plan  [Use arrows to move, type to filter]
    > Free: 100 MB Max Data Size, ($0 / month)
      200M: 200 MB Max Data Size, ($10 / month)
      3G: 3 GB Max Data Size, ($90 / month)
    ## after this, you will see your redis credentials, save it for later use

    Deploy now? [Y/n]: n
    ```

    **PS:** *You can use external Postgres from [Supabase](https://supabase.com) or external Redis from [Upstash](https://upstash.com)*. Just answer `n` to the questions Postgres and Redis setup. After that, you can set the environment variables manually.

- Set the environment variables:
  ```shell
  flyctl secrets set \ 
  ADMIN_USERNAME=@your_username \
  ENV=develop \ 
  REACT_APP_API_URL=https://your-app.fly.dev \
  CACHE_FILES_LIMIT=20GB \
  DATABASE_URL=your-postgres-url \
  REACT_APP_TG_API_HASH=your-tg-api-hash \
  REACT_APP_TG_API_ID=your-tg-api-id \
  TG_API_HASH=your-api-hash \ 
  TG_API_ID=your-api-id \
  REDIS_URI=your-redis-uri \
  API_JWT_SECRET=your-jwt \
  FILES_JWT_SECRET=your-jwt-secret
  ```

- Deploy the app:
  ```shell
  flyctl deploy --dockerfile Dockerfile.fly
  ```

- After the deployment is finished, you will see the app url.
  
## Deployment (using Github Actions)
**Note.** *You need a github account to follow the next steps.*

- [Fork teledrive](https://github.com/mgilangjanuar/teledrive/fork)

- Clone your forked repository

- Create Fly's app:
  
    ```shell
    flyctl launch
    ```

    and answer the questions like in the manual deployment. If the app created you can continue to the next step.
  
- Go to GitHub's Settings page -> Secrets and Variables -> New repository secret

- Create a new secret with the name `FLY_API_TOKEN` and the value is your [fly.io](https://fly.io/) API token. You can get it from [here](https://fly.io/user/personal_access_tokens).

- Create a new secret with the name `ADMIN_USERNAME`, `ENV`, `REACT_APP_API_URL`, `CACHE_FILES_LIMIT`, `DATABASE_URL`, `REACT_APP_TG_API_HASH`, `REACT_APP_TG_API_ID`, `TG_API_HASH`, `TG_API_ID`, `REDIS_URI`, `API_JWT_SECRET`, `FILES_JWT_SECRET` and the value is your environment variables.

- Go to Actions page and enable the workflow.

- Open `fly.toml` file and commit it to your forked repository.

- Now you can push your changes to your forked repository and the workflow will be triggered automatically.

- Go to Actions page and you will see the workflow is running. 

## Upgrade (manual)

Upgrade to the latest version of TeleDrive with this command:

```shell
git pull origin main

flyctl deploy --dockerfile Dockerfile.fly
```

## Upgrade (using Github Actions)

Just sync your forked repository with the original repository and the workflow will be triggered automatically.

## References

- [Hands-on with Fly.io](https://fly.io/docs/hands-on/)
- [Fly Apps](https://fly.io/docs/apps/)
- [Fly Postgres](https://fly.io/docs/postgres/)
- [Fly Redis](https://fly.io/docs/redis/)


