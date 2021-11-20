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
- Create a Telegram bot for forwarding messages from the contact form to your Telegram with [BotFather](https://t.me/botfather)
- Install the PostgreSQL as a database and sync the schema

  ```bash
  yarn server typeorm schema:sync
  ```

## Installation

- Define .env in `./server/.env` from `./server/.env-example` and `./web/.env` from `./web/.env-example`

  - Server variables

    | env                    | required | description                            |
    | ---------------------- | -------- | -------------------------------------- |
    | RPS                    | no       | Rate limit API per second, default: 20 |
    | TG_API_ID              | yes      | Application ID from your Telegram App  |
    | TG_API_HASH            | yes      | Application hash from Telegram App     |
    | TG_BOT_TOKEN           | yes      | Telegram bot token                     |
    | TG_BOT_OWNER_ID        | yes      | Chat ID for sending messages to you    |
    | DB_HOST                | no       | Database host URI, default: localhost  |
    | DB_NAME                | yes      | Database name                          |
    | DB_PORT                | no       | Database port, default: 5432           |
    | DB_USERNAME            | yes      | Database username                      |
    | DB_PASSWORD            | yes      | Database password                      |
    | GITHUB_TOKEN           | yes      | GitHub token for getting contributors  |
    | API_JWT_SECRET         | yes      | Random string for hashing auth token   |
    | FILES_JWT_SECRET       | yes      | Random string for encrypt public files |
    | PAYPAL_CLIENT_ID       | yes      | Client ID for PayPal subscription      |
    | PAYPAL_CLIENT_SECRET   | yes      | Client secret for PayPal subscription  |
    | PAYPAL_PLAN_PREMIUM_ID | yes      | Product ID for premium plan            |

  - Web variables

    | env               | required | description                                        |
    | ----------------- | -------- | -------------------------------------------------- |
    | REACT_APP_API_URL | no       | Base URL for the API, default: `''` (empty string) |

- Configure `~/.npmrc`
  Add your github personal token to `~/.npmrc`
  The ~/.npmrc will look like this:
  ```
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
  ```

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
