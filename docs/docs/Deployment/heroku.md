---
sidebar_position: 4
---

# Heroku

For deployment to [Heroku](https://heroku.com/) you need to create an account first.

**Note.** *You need to build TeleDrive with manual installation until [the build workspaces step](/docs/Installation/manual#build) in your local machine.*

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


### Database creation

- Install [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql) as addon