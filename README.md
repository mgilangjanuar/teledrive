# 🚀 TeleDrive

This is the open source project of Google Drive/OneDrive/iCloud/Dropbox alternative using Telegram API for the free unlimited cloud storage.

[![img](https://drive.google.com/uc?id=1o2HnKglEF0-cvtNmQqWZicJnSCSmnoEr)](https://twitter.com/telegram/status/1428703364737507332)

## Motivation

 - [Google Photos ends the free storage service](https://www.techradar.com/news/google-photos-price)
 - We deserve the free cloud storage service! Pricing: [Google Drive](https://one.google.com/about/plans), [OneDrive](https://one.google.com/about/plans), [Dropbox](https://www.dropbox.com/individual/plans-comparison), [iCloud](https://support.apple.com/en-us/HT201238)

## Getting Started

 - Define .env in `./server/.env` from `./server/.env-example` and `./web/.env` from `./web/.env-example`

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
