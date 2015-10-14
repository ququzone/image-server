Image Server
============

Image Server 主要用来解决中小型网站和手机应用后台的图片存储以及缩放问题。

### 依赖

1. [Redis](http://redis.io/)
2. [Node.js](https://nodejs.org/en/)
3. [GraphicsMagick](http://www.graphicsmagick.org/)

### 安装

1. Install Redis
2. Install Node.js
3. Install GraphicsMagick
4. Edit `/etc/hosts` file add below line

	```
	127.0.0.1 image-server.redis.host
	```
	
5. Install Image Server
	
	```
	$ git clone https://github.com/ququzone/image-server.git
	$ cd image-server
	$ npm install
	$ node index.js
	```

### 使用

1. 上传图片
	
	在浏览器中打开 `http://localhost:3000/image` 上传图片
	也可以使用 `HttpClient` 直接上传图片，返回Json数据中包含上传成功后的唯一ID
	
2. 查看原图

	在浏览器中打开 `http://localhost:3000/image/{id}`
	
	id是第一步Json中返回的id，如果在应用中使用的时候可以采用客户端缓存图片，接口支持客户端缓存。
	
3. 缩放
	
	目前支持下面几种缩放方式：
	- `http://localhost:3000/image/{id}/view?w=200`
	- `http://localhost:3000/image/{id}/view?h=200`
	- `http://localhost:3000/image/{id}/view?w=200&h=100`
	
