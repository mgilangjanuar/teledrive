FROM node:16.14.0 as build
ARG REACT_APP_TG_API_ID
ARG REACT_APP_TG_API_HASH

WORKDIR /apps

COPY yarn.lock .
COPY package.json .
COPY server/package.json server/package.json
COPY web/package.json web/package.json
COPY docker/.env .
RUN yarn install
COPY . .
RUN yarn workspaces run build
