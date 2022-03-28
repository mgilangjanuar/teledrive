![img](./logoteledrive-white.png)

This is the open source project of Google Drive/OneDrive/iCloud/Dropbox alternative using Telegram API for the free unlimited cloud storage.

[![img](https://drive.google.com/uc?id=1o2HnKglEF0-cvtNmQqWZicJnSCSmnoEr)](https://twitter.com/telegram/status/1428703364737507332)

## Motivation

- [Google Photos ends the free storage service](https://www.techradar.com/news/google-photos-price)
- We deserve the free cloud storage service! Pricing: [Google Drive](https://one.google.com/about/plans), [OneDrive](https://one.google.com/about/plans), [Dropbox](https://www.dropbox.com/individual/plans-comparison), [iCloud](https://support.apple.com/en-us/HT201238)

## Requirements

- node ^14
- psql ^13
- yarn

## Getting Started

- [Create Telegram application](https://core.telegram.org/api/obtaining_api_id)
- Install the [PostgreSQL](https://www.postgresql.org/) as a database and sync the schema

  with dump.sql:

  ```bash
  psql db_name < ./server/src/model/migrations/dump.sql
  ```

- Setup environment variables

  - Server variables

    | env                    | required | description                                           |
    | ---------------------- | -------- | ----------------------------------------------------- |
    | ENV                    | no       | Hide the logs for production, default: develop        |
    | PORT                   | no       | Port for running API, default: 4000                   |
    | TG_API_ID              | yes      | Application ID from your Telegram App                 |
    | TG_API_HASH            | yes      | Application hash from Telegram App                    |
    | DB_HOST                | no       | Database host URI, default: localhost                 |
    | DB_NAME                | yes      | Database name                                         |
    | DB_PORT                | no       | Database port, default: 5432                          |
    | DB_USERNAME            | yes      | Database username                                     |
    | DB_PASSWORD            | yes      | Database password                                     |
    | FILES_JWT_SECRET       | yes      | Random string for encrypt public files                |

  - Web variables

    | env               | required | description                                                       |
    | ----------------- | -------- | ----------------------------------------------------------------- |
    | REACT_APP_API_URL | no       | Base URL for the API, default: `''` (empty string)                |
    | TG_API_ID         | yes      | Application ID from your Telegram App (for experimental features) |
    | TG_API_HASH       | yes      | Application hash from Telegram App  (for experimental features)   |

## Installation

### Docker

- Define environment variables in `./docker/.env`
- Run

  ```bash
  docker-compose -f docker/docker-compose.yml up -d
  ```
- Open `teledrive.localhost` in browser

### Manual

- Define environment variables in `./server/.env` and `./web/.env`

- Create .npmrc in `~/.npmrc`
  and add your GitHub personal token

  ```bash
  # Copy these lines

  //npm.pkg.github.com/:_authToken=yourtoken
  @mgilangjanuar:registry=https://npm.pkg.github.com/
  ```
- Install dependencies

  ```bash
  yarn install
  ```

- Build all

  ```bash
  yarn workspaces run build
  ```

- Run

  ```bash
  # All services will served in server with Express
  yarn server node .
  ```

- Open `localhost:4000` *(default port: 4000)*

Or, if you want to run in the local environment:

- Build server

  ```bash
  yarn server build -w
  ```

- Run server

  ```bash
  yarn server start
  ```

- Run web

  ```bash
  # Define the REACT_APP_API_URL in web/.env first, then
  yarn web start

  # Or, directly define the env
  REACT_APP_API_URL=http://localhost:4000 yarn web start
  ```

## API Documentation

[![Run in Postman](https://run.pstmn.io/button.svg)](https://www.postman.com/restfireteam/workspace/mgilangjanuar/collection/1778529-3e4b0f8d-f721-4055-8d30-33cacaea93e6?ctx=documentation)

## How to Contribute

- Fork and clone this repository
- Commit your changes
- Create a pull request to the `staging` branch

Or, just send us an [issue](https://github.com/mgilangjanuar/teledrive/issues) for reporting bugs and/or ask the questions, share your ideas, etc in [discussions](https://github.com/mgilangjanuar/teledrive/discussions).

## Folder Structure

We using the monorepo structure with [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/).

```
.
├── README.md
├── package.json
├── server
│   ├── package.json
│   ├── src
│   │   └── index.ts
│   └── tsconfig.json
├── web
│   ├── package.json
│   ├── public
│   ├── src
│   │   ├── pages
│   │   └── App.tsx
│   ├── tsconfig.json
│   └── yarn.lock
└── yarn.lock
```
