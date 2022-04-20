---
sidebar_position: 4
---

# Heroku

For deployment to [Heroku](https://heroku.com/) you need to create an account first.

**Note.** *You need to clone TeleDrive in your local machine first.*

## Prerequisite

Get started by build all needed services.

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) version 7.59.4 or above

- [PostgreSQL](https://www.postgresql.org/) version 14.2 or above:

  Needed for importing SQL file. Install with this command (Ubuntu):

  ```shell
  sudo apt install postgresql -y
  ```

### Project creation

- Create a project from [Heroku dashboard](https://dashboard.heroku.com/apps)
- Login from Heroku CLI in terminal:

  ```shell
  heroku login
  ```
- Add heroku as a remote repository:

  ```shell
  heroku git:remote -a [YOUR_APP_NAME]
  ```

### Database preparation

- Install [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql) as addon and connect to your project.
- Go to the settings page and View Credentials of your database and set the following variables:

  ```shell
  heroku config:set USE_PSQL_HEROKU=1
  heroku config:set DATABASE_URL=YOUR_DB_CONNECTION_URI
  ```

  **Note.** *Change `YOUR_DB_CONNECTION_URI` to your database connection URI.*

### Provide environment variables

Set all variables with your own values to Heroku:

```shell
heroku config:set ENV_NAME=ENV_VALUE
```

**Note.** *Change `ENV_NAME` and `ENV_VALUE` to your value as defined below.*

- Define all server variables

  | env                    | required | description                                           |
  | ---------------------- | -------- | ----------------------------------------------------- |
  | ENV                    | no       | Hide the logs for production, default: develop        |
  | TG_API_ID              | yes      | Application ID from your Telegram App                 |
  | TG_API_HASH            | yes      | Application hash from Telegram App                    |
  | ADMIN_USERNAME         | yes      | Telegram username of the admin TeleDrive              |
  | DATABASE_URL           | yes      | PostgreSQL connection URI, format: `postgresql://[user]:[password]@[host]:[port][/dbname][?paramspec]` |
  | API_JWT_SECRET         | yes      | Random string for encrypt JWT web token               |
  | FILES_JWT_SECRET       | yes      | Random string for encrypt public files                |

- Define all web variables

  | env                   | required | description                                                       |
  | --------------------- | -------- | ----------------------------------------------------------------- |
  | REACT_APP_API_URL     | no       | Base URL for the API, default: `''` (empty string)                |
  | REACT_APP_TG_API_ID   | yes      | Application ID from your Telegram App *(for experimental features)* |
  | REACT_APP_TG_API_HASH | yes      | Application hash from Telegram App  *(for experimental features)*   |

## Deploy

Push your code to main branch in Heroku:

```shell
git push heroku main  # or staging:main, if you're from staging branch
```

Your app will automatically deploy to `[YOUR_APP_NAME].herokuapp.com`

## Upgrade

Upgrade to the latest version of TeleDrive with this command:

```shell
git pull origin main  # or, staging for the latest updates

git push heroku main  # or staging:main, if you're from staging branch
```

## Common Issues

- *Error: The local psql command could not be located*

  https://stackoverflow.com/questions/15576064/the-local-psql-command-could-not-be-located