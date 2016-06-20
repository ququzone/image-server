FROM node:argon

RUN apt-get update && apt-get install -y --no-install-recommends \
  graphicsmagick

UN mkdir -p /usr/app
WORKDIR /usr/app

COPY package.json /usr/app/
RUN npm install

COPY . /usr/app/

EXPOSE 3000
CMD ["npm", "start"]
