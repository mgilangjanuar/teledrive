---
sidebar_position: 4
---

# Heroku

For deployment to [Heroku](https://heroku.com/) you need to create an account first.

## Deployment
**Note.** *You need a github account to follow the next steps.*

- [Fork teledrive](https://github.com/mgilangjanuar/teledrive/fork)
  
- Copy your forked teledrive repository url

  > _Make sure to copy the entire url with "https://"_

  ![image](https://user-images.githubusercontent.com/42100404/180603080-abb10755-0d40-40b7-801a-1396877c31e1.png)

- Use this heroku template url

  > _Replace "{forked-repo-url}" with your forked teledrive repository url_

  ```
  https://dashboard.heroku.com/new?template={forked-repo-url}
  ```

**If you want to upgrade your application to the latest version, you can use these following steps:**

**Note.** *You need to clone TeleDrive in your local machine first.*

## Prerequisite

Get started by build all needed services.

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) version 7.59.4 or above

### Environment variables

- Server variables

  | env                    | required | description                                           |
  | ---------------------- | -------- | ----------------------------------------------------- |
  | ENV                    | no       | Hide the logs for production, default: develop        |
  | TG_API_ID              | yes      | Application ID from your Telegram App                 |
  | TG_API_HASH            | yes      | Application hash from Telegram App                    |
  | ADMIN_USERNAME         | yes      | Telegram username of the admin TeleDrive              |
  | DATABASE_URL           | yes      | PostgreSQL connection URI, format: `postgresql://[user]:[password]@[host]:[port][/dbname][?paramspec]` |

- Web variables

  | env                   | required | description                                                       |
  | --------------------- | -------- | ----------------------------------------------------------------- |
  | REACT_APP_API_URL     | no       | Base URL for the API, default: `''` (empty string)                |
  | REACT_APP_TG_API_ID   | yes      | Application ID from your Telegram App *(for experimental features)* |
  | REACT_APP_TG_API_HASH | yes      | Application hash from Telegram App  *(for experimental features)*   |

### Set up Heroku CLI

- Clone the repository to your local machine and point to the local directory:

  ```shell
  git clone https://github.com/mgilangjanuar/teledrive.git
  cd teledrive
  ```

- Login from Heroku CLI in terminal:

  ```shell
  heroku login
  ```

- Add heroku as a remote repository:

  ```shell
  heroku git:remote -a [YOUR_APP_NAME]
  ```

## Upgrade

Upgrade to the latest version of TeleDrive with this command:

```shell

git pull origin main  # or, staging for the latest updates

git push heroku main  # or staging:main, if you're from staging branch
```
