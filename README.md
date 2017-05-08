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

Compose asynchronous functions (promise-based)

```js
import { compose } from 'throwback'

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

## Inspiration

Built for [`popsicle`](https://github.com/blakeembrey/popsicle) and inspired by [`koa-compose`](https://github.com/koajs/compose).

## License

MIT
