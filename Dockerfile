FROM node:14.19.0 as build
ARG NPM_TOKEN
WORKDIR /apps
COPY package.json .
COPY yarn.lock .
COPY ./package.json .
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    echo "@mgilangjanuar:registry=https://npm.pkg.github.com/" >> ~/.npmrc && \
    yarn install && \
    rm -f ~/.npmrc
COPY . .
RUN yarn workspaces run build