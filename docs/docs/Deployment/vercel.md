---
sidebar_position: 3
---

# Vercel **[Broken]**

For deployment to [Vercel](https://vercel.com/) you need to create an account first.

**Note.** *You need to build TeleDrive with manual installation until [the build workspaces step](/docs/Installation/manual#build) in your local machine.*

## Prerequisite

Get started by installing all needed services.

### What you'll need

- [Vercel CLI](https://vercel.com/docs/cli) version 24.0.0 or above:

  Install globally with npm:

  ```shell
  npm i -g vercel
  ```

## Deploy

**Note.** *We'll using Vercel CLI for deployment. So, don't need to import repository from Vercel dashboard.*

First, login to your Vercel account:

```shell
vercel login
```

After build TeleDrive with manual installation, you can deploy it to Vercel.

```shell
vercel --prod
```

Follow all the steps to deploy your application to Vercel.

You can set up the server variables in the Vercel Dashboard select *your project* then select *Settings > Environment Variables*.