---
sidebar_position: 2
---

# Nginx

[Nginx](https://www.nginx.com/) is a popular web server. It is used for reverse proxy and load balancing.

**Note.** *You need to run TeleDrive in your machine*

## Prerequisite

Get started by build all needed services.

### What you'll need

- TeleDrive running application
- Domain name and set up DNS A record with your public IP address

## Setup Config

Create a new config file `/etc/nginx/sites-available/teledrive` with the following content:

```
upstream teledrive {
    server 127.0.0.1:4000;               # running application with active port
}

server{
  server_name your-domain-name.com;      # change to your domain name

  send_timeout                60m;
  client_header_timeout       60m;
  client_body_timeout         60m;
  client_max_body_size        2048M;
  large_client_header_buffers 8 256k;

  location / {
    proxy_pass http://teledrive/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    client_max_body_size 2048M;

    proxy_buffer_size 256k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
  }
}
```

Then, link the config file to `/etc/nginx/sites-enabled/teledrive`:

```shell
sudo ln -s /etc/nginx/sites-available/teledrive /etc/nginx/sites-enabled/teledrive
```

## Restart Nginx

Try to check the web config:

```shell
nginx -t
```

Then, restart the service:

```
sudo service nginx restart
```

Now, you can access TeleDrive from your domain name 🎊

## SSL Certificate

For security reason please create a SSL certificate for your domain name. We recommend using Let's Encrypt service. Here's how to do it: https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04