---
sidebar_position: 1
---

# PM2

[PM2](https://pm2.keymetrics.io/) will daemonize your application and run it on a cluster of servers.

**Note.** *You need to build TeleDrive with manual installation until [the build workspaces step](/docs/Installation/manual#build) in cloud machine like [Droplets in DigitalOcean](https://www.digitalocean.com/products/droplets), [EC2 in AWS](https://aws.amazon.com/ec2/), [Compute Engine in Google Cloud Platform](https://cloud.google.com/compute), etc.*

## Prerequisite

Get started by installing all needed services.

### What you'll need

- [PM2](https://www.npmjs.com/package/pm2) version 5.2.0 or above:

  Install globally with npm:

  ```shell
  npm i -g pm2
  ```

## Deploy

Daemonize the running application with PM2:

```shell
cd server
pm2 start dist/index.js --name teledrive
```

View the logs with PM2:

```shell
pm2 log teledrive
```

Restart the service with:

```shell
pm2 restart teledrive
```

Next, you need to reverse proxy the application to your domain with [Nginx](/docs/deployment/nginx).