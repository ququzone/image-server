FROM node:argon

RUN apt-get update && apt-get install -y --no-install-recommends \
        autoconf \
        automake \
        bzip2 \
        file \
        g++ \
        gcc \
        graphicsmagick \
        libbz2-dev \
        libc6-dev \
        libcurl4-openssl-dev \
        libevent-dev \
        libffi-dev \
        libgeoip-dev \
        libglib2.0-dev \
        libjpeg-dev \
        liblzma-dev \
        libmagickcore-dev \
        libmagickwand-dev \
        libmysqlclient-dev \
        libncurses-dev \
        libpng-dev \
        libpq-dev \
        libreadline-dev \
        libsqlite3-dev \
        libssl-dev \
        libtool \
        libwebp-dev \
        libxml2-dev \
        libxslt-dev \
        libyaml-dev \
        make \
        patch \
        xz-utils \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY package.json /usr/app/
RUN npm install

COPY . /usr/app/

EXPOSE 3000
CMD ["npm", "start"]
