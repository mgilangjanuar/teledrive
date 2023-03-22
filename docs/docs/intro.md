---
sidebar_position: 1
---

# Introduction

 - version: 2.3.x
 - updated: 2022-05-13

If you ever heard about cloud storage services like Google Drive, OneDrive, iCloud, Dropbox &mdash; **TeleDrive** is one of them, you can upload photos, videos, documents, or any files for free. But, what makes **TeleDrive** different? We're using the <a href="https://core.telegram.org/api#telegram-api" target="_blank">Telegram API</a>, so you can do uploads without limit and free.

## Prerequisite

Get started by installing all needed services.

### OS recommendation

- Ubuntu 20.04

  Install build-essential with command:

  ```shell
  sudo apt install build-essential -y
  ```

### Repository

Clone the repository by:

```shell
git clone https://github.com/mgilangjanuar/teledrive.git
cd teledrive
```

### Access keys

You need to create an application on [Telegram](https://my.telegram.org/) first.

![img](https://res.cloudinary.com/mgilangjanuar/image/upload/v1648508069/teledrive/Screen_Shot_2022-03-29_at_05.52.20_rf4dxt.png)

**Note.** *Save the access keys in the environment variables.*

```
TG_API_ID=[your_api_id]
TG_API_HASH=[your_api_hash]
```

## Next Steps

Next, you can select where you want to install TeleDrive.

- Virtual machine (Ubuntu 20.04) *(difficulty level: high)*

  Clone repository to your virtual machine and choose the installation method:

  - Running application with [Docker](/docs/installation/docker):
    - Then, setup domain with reverse proxy ([nginx](/docs/deployment/nginx))
  - Or, running with [manual](/docs/installation/manual):
    - Daemonize the application with [pm2](/docs/deployment/pm2)
    - Then, setup domain with reverse proxy ([nginx](/docs/deoloyment/nginx))

- Heroku *(difficulty level: low)*

  - Clone repository to your local machine
  - Deploy to [Heroku](/docs/deployment/heroku)

- Vercel *(difficulty level: low)* [Build failed, last update: [#336](https://github.com/mgilangjanuar/teledrive/issues/336#issuecomment-1120316455)]

  - Clone repository to your local machine
  - Build with [manual](/docs/installation/manual) method
  - Deploy to [Vercel](/docs/deployment/vercel)

  **Note.** *Vercel doesn't have database service. So, you need to create a database manually in [Supabase](https://supabase.com/), [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql), [ElephantSQL](https://www.elephantsql.com/), or any other database service.*
