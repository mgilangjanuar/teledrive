---
sidebar_position: 1
---

# Introduction

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

# then, change to the main branch for the stable version
git checkout main
```

### Access keys

You need to create an application on [Telegram](https://my.telegram.org/) first.

![img](https://res.cloudinary.com/mgilangjanuar/image/upload/v1648508069/teledrive/Screen_Shot_2022-03-29_at_05.52.20_rf4dxt.png)

Save the access keys in the environment variables.

```shell
TG_API_ID=[your_api_id]
TG_API_HASH=[your_api_hash]
```

Next, go to the installation tutorial with [Docker](/docs/installation/docker) or [manual](/docs/installation/manual) installation.