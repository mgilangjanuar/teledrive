FROM node:14.19.0 as build
ARG BUILD_CONTEXT
ARG NPM_TOKEN
WORKDIR /apps
COPY package.json .
COPY yarn.lock .
COPY ./$BUILD_CONTEXT/package.json ./$BUILD_CONTEXT/
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    echo "@mgilangjanuar:registry=https://npm.pkg.github.com/" >> ~/.npmrc && \
    yarn install && \
    rm -f ~/.npmrc
COPY ./$BUILD_CONTEXT/ ./$BUILD_CONTEXT/
RUN yarn $BUILD_CONTEXT build