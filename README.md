# MaximusChain Library

A pure and powerful JavaScript library for MaximusChain.

MaximusChain is a peer-to-peer platform for the next generation of financial technology. The decentralized nature of the network allows for highly resilient infrastructure.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [License](#license)

## Install

### NodeJS

```
npm install @maximus-chain/maximus-lib
```

### Browser

#### CDN Standalone

```html
<script src="https://unpkg.com/@maximus-chain/maximus-lib"></script>
<script>
  const { PrivateKey } = maximus;
  const privateKey = new PrivateKey();
  const address = privateKey.toAddress().toString();
  ...
</script>
```

#### Building the Browser Bundle

```sh
npm run build
```

This will generate a file named `maximus-lib.min.js` in the `dist/` folder.

## Usage

### Browser

```html
<script src="./dist/maximus-lib.min.js" type="text/javascript"></script>
<script>
  const PrivateKey = maximus.PrivateKey;
  const privateKey = new PrivateKey();
  const address = privateKey.toAddress().toString();
</script>
```

### Development & Tests

```sh
git clone https://github.com/Maximus-Chain/maximus-lib
cd maximus-lib
npm install
```

Run all the tests:

```sh
npm test
```

You can also run just the Node.js tests with `npm run test:node`, just the browser tests with `npm run test:browser` or run a test coverage report with `npm run coverage`.

## Documentation

- [Core Concepts](docs/core-concepts/)
- [Usage Guides](docs/usage/)
- [Examples](docs/examples.md)

## License

Code released under [the MIT license](LICENSE).

Copyright 2026 MaximusChain.
