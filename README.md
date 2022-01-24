<!-- teledrive/README.md -->
<!-- A more readable version of this file can be found on https://github.com/mgilangjanuar/teledrive -->


# [![TeleDrive logo][logo]][repo]

An open-source alternative to any pointlessly expensive cloud drive technology, using the [Telegram API][telegram-api]
for free-of-charge, unlimited online storage. [teledriveapp.com](https://teledriveapp.com)


[![Tweet from @telegram][telegram-tweet-image]][telegram-tweet-url]


## Motivation (as to why?)

- Google Photos ends its free storage service as of June of 2021:
  [Google Photos price: what will it charge when free storage ends in June? | TechRadar][techradar-gdrive] ;
- We deserve the free cloud storage service! "Premium" pricings: [Google Drive][pricings-gdrive],
  [OneDrive][pricings-onedrive], [Dropbox](pricings-dropbox), [iCloud][pricings-icloud].


## Self-hosting

### Requirements

**Software:**

- `nodejs` >= 14 (we suggest installing a version manager like `nvm`) ;
- `postgresql` >= 13.


**Telegram:**

- An **API ID** and **API hash**, obtained by [creating an application][telegram-api-create-app] ;
- A **bot token**, obtained by creating a bot using [BotFather][telegram-botfather].


**GitHub:**

- A **personal access token** (PAT), to access GitHub's NPM registry:
  [Creating a personal access token - GitHub Docs][gh-docs-create-pat].


***(Misc)* Paypal**, if you plan on having some kind of 'premium plan':

- A **client ID** and **client secret**: *(missing documentation)*.
- A **product ID**: *(missing documentation)*.


### Installation

- Install the required software (see [the requirement section](#Requirements)) using your OS' package manager (and
*maybe* some obscure guide from the Internet). **Double check the versions!**
- Install yarn globally from npm: `npm i -g yarn`

- Clone the repository: `git clone https://github.com/mgilangjanuar/teledrive`
- Switch to the working directory: `cd teledrive`

- Create a `.npmrc` file **in the project root**, containing the following:
  ```
  //npm.pkg.github.com/:_authToken={YOUR_CREATED_GITHUB_PAT}
  @mgilangjanuar:registry=https://npm.pkg.github.com/
  ```
- Download the required libraries using yarn: `yarn install`

- Copy the example environment variables for the cloud server: `cp server/.env-example server/.env`
- Edit the cloud server's environment variables (according to the
  [cloud server variables cheat sheet](#cloud-server-variables-cheat-sheet)) using your favorite text editor, ours is
  **nvim**: `nvim server/.env`

- Copy the example environment variables for the web server:  `cp web/.env-example web/.env`
- Edit the web server's environment variables (according to the
  [web server variables cheat sheet](#web-server-variables-cheat-sheet)) using your favorite text editor, ours is
  **nvim**: `nvim web/.env`


### Running stuff

**In a *production* environment:**

- Start a production-optimized build *(this can take some time, be patient!)*: `yarn workspaces run build`
- Start the cloud server, and serve the web server with express: `yarn server node .`


**Or in a local/independant way:**

- Building the cloud server in watchdog mode: `yarn server build -w`
- Running the cloud server: `yarn server start`
- Running the web server `yarn web start`


## Contributing

### Addressing issues

You can help by [creating an issue](new-issue) if yours was not already described in [other issues](issues) in order to
report bugs. Please be as precise as psosible when describing your issue.

You can also just ask questions, share ideas, or any other related stuff in the [discussions tab](discussions).


### Adding your own sauce

You can also help by [forking](./fork) the repository, making your changes and [creating a new pull request](new-pr)
into the `staging` branch. Please be as precise as possible when describing your commits, following our commit style.


## Folder Structure

We are using the monorepo structure with [yarn workspaces][yarn-workspaces].


## Cloud server variables cheat sheet

| env                    | required | description                                                        | default            |
| ---------------------- | -------- | ------------------------------------------------------------------ | ------------------ |
| RPS                    | no       | API rate limit, in request per second                              | 20                 |
| TG_API_ID              | yes      | Telegram API ID                                                    | N/A                |
| TG_API_HASH            | yes      | Telegram API hash                                                  | N/A                |
| TG_BOT_TOKEN           | yes      | Telegram bot token                                                 | N/A                |
| TG_BOT_OWNER_ID        | yes      | Telegram user ID, used to send you messages                        | N/A                |
| DB_HOST                | no       | PostgreSQL database host                                           | localhost          |
| DB_PORT                | no       | PostgreSQL database port                                           | 5432               |
| DB_USERNAME            | yes      | PostgreSQL database username                                       | N/A                |
| DB_PASSWORD            | yes      | PostgreSQL database password                                       | N/A                |
| DB_NAME                | no       | PostgreSQL database name                                           | *same as username* |
| GITHUB_TOKEN           | yes      | GitHub PAT, used for fetching contributors                         | N/A                |
| API_JWT_SECRET         | yes      | Random string for hashing auth token                               | N/A                |
| FILES_JWT_SECRET       | yes      | Random string for encrypt public files                             | N/A                |
| PAYPAL_CLIENT_ID       | no       | Client ID for PayPal subscription, let empty to disable PayPal     | *empty*            |
| PAYPAL_CLIENT_SECRET   | no       | Client secret for PayPal subscription, let empty to disable PayPal | *empty*            |
| PAYPAL_PLAN_PREMIUM_ID | no       | Product ID for premium plan, set empty to disable PayPal           | *empty*            |
| REDIS_URI              | no       | Cache some responses from external services                        | *redis default*    |
| UTILS_API_KEY          | yes      | Token key for make all servers communicate                         | N/A                |


## Web server variables cheat sheet

| env               | required | description  | default |
| ----------------- | -------- | ------------ | ------- |
| REACT_APP_API_URL | no       | API base URL | *empty* |


## Folder Structure

We using the monorepo structure with [yarn workspaces][yarn-workspaces].

```
.
├── press
│   └── ...
├── server
│   ├── ormconfig.js
│   ├── package.json
│   ├── src
│   │   └── ...
│   ├── tsconfig.json
│   └── yarn-error.log
├── web
│   ├── craco.config.js
│   ├── package.json
│   ├── public
│   │   └── ...
│   ├── src
│   │   └── ...
│   ├── sw-config.js
│   ├── tsconfig.json
│   └── yarn.lock
├── LICENSE.md
├── logoteledrive-white.png
├── README.md
├── package.json
├── upgrade.js
├── vercel.json
└── yarn.lock
```

<!-- Links -->

[repo]: https://github.com/mgilangjanuar/teledrive
[logo]: https://raw.githubusercontent.com/mgilangjanuar/teledrive/staging/logoteledrive-white.png

[postman-url]: https://documenter.getpostman.com/view/1778529/UV5TGf4u
[postman-image]: https://run.pstmn.io/button.svg

[telegram-tweet-url]: https://twitter.com/telegram/status/1428703364737507332
[telegram-tweet-image]: https://drive.google.com/uc?id=1o2HnKglEF0-cvtNmQqWZicJnSCSmnoEr

[techradar-gdrive]: https://www.techradar.com/news/google-photos-price

[pricings-gdrive]: https://one.google.com/about/plans
[pricings-onedrive]: https://www.microsoft.com/microsoft-365/onedrive/compare-onedrive-plans
[pricings-dropbox]: https://www.dropbox.com/individual/plans-comparison
[pricings-icloud]: https://support.apple.com/en-us/HT201238

[telegram-api]: https://core.telegram.org
[telegram-api-create-app]: https://core.telegram.org/api/obtaining_api_id
[telegram-botfather]: https://t.me/botfather

[gh-docs-create-pat]: https://docs.github.com/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-token

[new-issue]: https://github.com/mgilangjanuar/teledrive/issues/new
[issues]: https://github.com/mgilangjanuar/teledrive/issues
[discussions]: https://github.com/mgilangjanuar/teledrive/discussions

[yarn-workspaces]: https://classic.yarnpkg.com/en/docs/workspaces/
