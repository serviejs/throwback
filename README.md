# Throwback

[![NPM version](https://img.shields.io/npm/v/throwback.svg?style=flat)](https://npmjs.org/package/throwback)
[![NPM downloads](https://img.shields.io/npm/dm/throwback.svg?style=flat)](https://npmjs.org/package/throwback)
[![Build status](https://img.shields.io/travis/serviejs/throwback.svg?style=flat)](https://travis-ci.org/serviejs/throwback)
[![Test coverage](https://img.shields.io/coveralls/serviejs/throwback.svg?style=flat)](https://coveralls.io/r/serviejs/throwback?branch=master)

> An asynchronous middleware pattern.

## Installation

```sh
npm install throwback --save
```

## Usage

Compose `async` functions like middleware.

```js
const { compose } = require('throwback')

const fn = compose([
  async function (req, res, next) {
    console.log(1)

    try {
      await next()
    } catch (err) {
      console.log('throwback', err)
    }

    console.log(4)
  },
  async function (req, res, next) {
    console.log(2)

    return next()
  }
])

// Callback runs at the end of the stack, before
// the middleware bubbles back to the beginning.
fn({}, {}, function (req, res) {
  console.log(3)

  res.status = 404
})
```

Build a micro HTTP server!

```js
const { createServer } = require('http')
const finalhandler = require('finalhandler')
const { compose } = require('throwback')

const app = compose([
  function (req, res) {
    res.end('Hello world!')
  }
])

createServer(function (req, res) {
  return app(req, res, finalhandler(req, res))
}).listen(3000)
```

## Uses

* HTTP requests ([`popsicle`](https://github.com/blakeembrey/popsicle))
* HTTP servers (e.g. [`servie`](https://github.com/serviejs/servie) and plain HTTP)
* Processing pipelines (e.g. [`scrappy`](https://github.com/blakeembrey/node-scrappy))

## License

MIT
