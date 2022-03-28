---
sidebar_position: 4
---

# Heroku

For deployment to [Heroku](https://heroku.com/) you need to create an account first.

## Prerequisite

Get started by build all needed services.

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) version 7.59.4 or above

### Project creation

- Create a project from Heroku dashboard
- Login from Heroku CLI:

  ```shell
  heroku login
  ```
- Add heroku as a remote repository:

  ```shell
  heroku git:remote -a [YOUR_APP_NAME]
  ```
- Set NPM_TOKEN:

  Create a personal token from your [GitHub account](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with [these permissions](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages#about-scopes-and-permissions-for-package-registries) and set it as an environment variable:

  ```shell
  heroku config:set NPM_TOKEN=[YOUR_TOKEN]
  ```

  Create `.npmrc` file in root project or run this command:

  ```shell
  echo '@mgilangjanuar:registry=https://npm.pkg.github.com/' > .npmrc
  echo '//npm.pkg.github.com/:_authToken=${NPM_TOKEN}' >> .npmrc
  ```

### Database preparation

- Install [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql) as addon to your project.
- Go to the settings page and View Credentials of your database and set the following variables:

  ```shell
  heroku config:set DB_HOST=[YOUR_DB_HOST]
  heroku config:set DB_PORT=[YOUR_DB_PORT]
  heroku config:set DB_USERNAME=[YOUR_DB_USER]
  heroku config:set DB_PASSWORD=[YOUR_DB_PASSWORD]
  heroku config:set DB_NAME=[YOUR_DB_NAME]
  ```

### Provide environment variables

Complete all variables from `./server/.env` and `./web/.env` with your own values to Heroku:

```shell
heroku config:set [ENV_NAME]=[ENV_VALUE]
```

## Deploy

Push your code to main branch in Heroku:

```shell
git push heroku main  # or staging:main, if you're from staging branch
```

Your app will automatically deploy to [your-project-name].herokuapp.com