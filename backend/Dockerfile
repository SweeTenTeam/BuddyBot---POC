FROM node:20-alpine

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json


WORKDIR /app

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node","index.mjs"]