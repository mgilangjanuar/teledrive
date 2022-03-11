FROM node:14.19.0 as build
ARG NPM_TOKEN
ARG BUILD_CONTEXT

WORKDIR /apps

COPY yarn.lock .
COPY $BUILD_CONTEXT/package.json .
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    echo "@mgilangjanuar:registry=https://npm.pkg.github.com/" >> ~/.npmrc
RUN npm i react-scripts -g --silent && \
    npm i typescript
RUN yarn install
RUN rm -f ~/.npmrc
COPY $BUILD_CONTEXT .
RUN yarn run build