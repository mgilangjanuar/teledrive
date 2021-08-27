# TeleDrive

This is the open source project of Google Drive/OneDrive/iCloud/Dropbox alternative using Telegram API for the free unlimited cloud storage.

![img](https://lh6.googleusercontent.com/BSuWa2VPQu_LIiH8Luxf7AqIlqBcayv-pR_39Jm5IpTyqvbGmKKNYNS3uK-kaNhHI6Vawh6mqznNSpgMZ_FQ=w3360-h1880)

*link: [https://twitter.com/telegram/status/1428703364737507332](https://twitter.com/telegram/status/1428703364737507332)*

## Motivation

 - [Google Photos ends the free storage service](https://www.techradar.com/news/google-photos-price)
 - We deserve the free cloud storage service! Pricing: [Google Drive](https://one.google.com/about/plans), [OneDrive](https://one.google.com/about/plans), [Dropbox](https://www.dropbox.com/individual/plans-comparison), [iCloud](https://support.apple.com/en-us/HT201238)

## Getting Started

 - Build All

   ```bash
   yarn workspaces run build
   ```

 - Run

   ```bash
   # All services will served in server with Express
   yarn server node .
   ```

Or, if you want to run in the local environment:

 - Build Server

   ```bash
   yarn server build -w
   ```

 - Run Server

   ```bash
   yarn server start
   ```

 - Run Web

   ```bash
   # Define the REACT_APP_API_URL in web/.env first, then
   yarn web start
   ```

## How to Contribute

 - Clone and create another branch with prefix `feature/`, `bugfix/`, `experimental/`, and `refactor/`
 - Create a pull request to the `main` branch
 - Always remove your branch after merged
 - We don't use another branch like staging, develop, etc

   ![meme](https://pics.me.me/thumb_weldont-do-that-here-we-dont-do-that-here-49999819.png)

Or, just send us an [issue](https://github.com/mgilangjanuar/teledrive/issues) for reporting bugs and/or ask the questions, share your ideas, etc in [discussions](https://github.com/mgilangjanuar/teledrive/discussions).

⚠️ **We'll haven't any channel to chat/discuss platforms** like Discord/Slack/etc except the GitHub Discussions and Issues for the well-documented conversations.

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