FROM node:18.16.0 as build
ARG REACT_APP_TG_API_ID
ARG REACT_APP_TG_API_HASH
# NOTE: If you encounter the following error after deploying:
# failed to solve: error from sender: open /home/user/teledrive/docker/data: permission denied
# Please run the following commands:
# cd docker
# sudo chmod -R 777 data
# Then, you can go back to the root directory of the project with
# cd ../
# You can then start the script again, and the issue should be resolved. Note that the permissions will be reset, so you will need to perform this step every time you redeploy the docker.
WORKDIR /apps

COPY yarn.lock .
COPY package.json .
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY docker/.env .
RUN yarn cache clean
RUN yarn install
RUN yarn global add prisma
RUN npx browserslist@latest --update-db
COPY . .
RUN export NODE_OPTIONS="--openssl-legacy-provider --no-experimental-fetch" && yarn workspaces run build