FROM node:alpine

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json


WORKDIR /app
RUN npm install confluence-api
RUN npm install jira-client
RUN npm install jsdom
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node","--no-warnings","index.mjs"]