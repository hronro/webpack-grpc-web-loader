# Webpack GRPC Web Loader

## Install

👉 You don't have to install protoc or [protoc-gen-grpc-web](https://github.com/grpc/grpc-web/releases) plugin in your environment, just use npm or yarn to install this webpack loader, and everything is done.

```sh
npm install --save-dev webpack-grpc-web-loader
```

Or

```sh
yarn add --dev webpack-grpc-web-loader
```

## Getting Started

### webpack.config.js

```javascript
const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.proto$/,
        use: [
          {
            loader: 'webpack-grpc-web-loader',
            options: {
              protoPath: path.resolve(__dirname, './src/protos'),
            },
          },
        ],
      },
    ],
  },
};
```

If you have multiple proto paths, you can pass an array to the option `protoPath`:

```javascript
{
  loader: 'webpack-grpc-web-loader',
  options: {
    protoPath: [
      path.resolve(__dirname, './src/my-protos-1'),
      path.resolve(__dirname, './src/my-protos-2'),
    ],
  },
}
```

### In your src

```javascript
import helloWorldProto from './hello-world.proto';

const client = new helloWorldProto.HelloWorldClient('http://localhost:11101/grpc');
const helloRequest = new helloWorldProto.HelloRequest();
client.helloWorld(helloRequest, {}, (err, res) => {
  // handle error and response here
});
```

## Options

| Option Name |        Type        | Required | Default Value |               Description               |
|-------------|:------------------:|:--------:|:-------------:|:---------------------------------------:|
| protoPath   | string \| string[] |   true   |      N/A      | Same as `--proto_path` (`-I`) in protoc |
