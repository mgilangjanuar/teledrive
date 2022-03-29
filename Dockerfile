FROM node:16.14.0 as build
ARG NPM_TOKEN

WORKDIR /apps

COPY yarn.lock .
COPY package.json .
COPY server/package.json server/package.json
COPY web/package.json web/package.json
# RUN echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
#     echo "@mgilangjanuar:registry=https://npm.pkg.github.com/" >> ~/.npmrc
# RUN npm i npm@latest && npm i react-scripts -g --force --silent && npm i typescript --force
RUN yarn install
# RUN rm -f ~/.npmrc
COPY . .
RUN yarn workspaces run build
