Image Server
============

Image Server 主要用来解决中小型网站和手机应用后台的图片存储、缩放以及智能裁剪等问题。

### 依赖

1. [Redis](http://redis.io/)
2. [Node.js](https://nodejs.org/en/)
3. [GraphicsMagick](http://www.graphicsmagick.org/)
4. [SeaweedFS](https://github.com/chrislusf/seaweedfs)

### 安装

1. Install Redis

	```
	$ sudo apt-get install redis-server
	```

2. Install Node.js

	```
	$ sudo apt-get install nodejs
	```

3. Install Canvas dependencies

	```
	$ sudo apt-get install libjpeg-dev
  $ sudo apt-get install libpango1.0-dev
  $ sudo apt-get install libcairo2-dev
	```

4. Install GraphicsMagick

	```
	$ sudo apt-get install -y \
			autoconf \
			build-essential \
			graphicsmagick \
			libbz2-dev \
			libcurl4-openssl-dev \
			libevent-dev \
			libffi-dev \
			libglib2.0-dev \
			libjpeg-dev \
			liblzma-dev \
			libncurses-dev \
			libssl-dev \
			libxml2-dev \
			libxslt-dev \
			libyaml-dev \
			zlib1g-dev
	```

5. Install SeaweedFS

	- Install go and set up $GOPATH [Guide](https://golang.org/doc/install)
	- Install mercurial

		```
		sudo apt-get install -y mercurial
		```

	- Download, compile and install SeaweedFS

		```
		$ go get github.com/chrislusf/seaweedfs/go/weed
		```

	- Start Master Server

		```
		$ $GOPATH/bin/weed master
		```

	- Start Volume Servers

		```
		$ $GOPATH/bin/weed volume -dir="/tmp/data1" -max=5 -mserver="localhost:9333" -port=50070
		```

6. Edit `/etc/hosts` file add below line

	```
	127.0.0.1 image-server.redis.host
	127.0.0.1 seaweedfs.master.host
	```

7. Install Image Server

	```
	$ git clone https://github.com/ququzone/image-server.git
	$ cd image-server
	$ npm install
	$ node index.js
	```

### 使用

1. 上传图片

	在浏览器中打开 `http://localhost:3000/image` 上传图片也可以使用 `HttpClient` 直接上传图片，返回 json 数据中包含上传成功后的唯一id

2. 查看原图

	在浏览器中打开 `http://localhost:3000/image/{id}`

	id是第一步 json 中返回的id，如果在应用中使用的时候可以采用客户端缓存图片，接口支持客户端缓存。

3. 缩放

	目前支持下面几种缩放方式：
	- `http://localhost:3000/image/{id}/view?w=200`
	- `http://localhost:3000/image/{id}/view?h=200`
	- `http://localhost:3000/image/{id}/view?w=200&h=100`

4. 智能裁剪

	- `http://localhost:3000/image/{id}/smart`
	- `http://localhost:3000/image/{id}/smart?w=200`
	- `http://localhost:3000/image/{id}/smart?h=200`
	- `http://localhost:3000/image/{id}/smart?w=200&h=100`

### 注意事项

1. 首次安装

	首次安装后，需要在浏览器中打开 `http://localhost:3000` 设置管理员帐号名和密码
