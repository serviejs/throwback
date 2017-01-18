import test = require('blue-tape')
import { compose, NextFunction } from './index'

test('async middleware', t => {
  t.test('middleware', t => {
    const arr: number[] = []

    const fn = compose([
      function (req: any, res: any, next: NextFunction<string>) {
        arr.push(1)

        return next().then(value => {
          arr.push(5)

          t.equal(value, 'propagate')

          return 'done'
        })
      },
      function (req: any, res: any, next: NextFunction<string>) {
        arr.push(2)

        return next().then(value => {
          arr.push(4)

          t.equal(value, 'hello')

          return 'propagate'
        })
      }
    ])

    return fn({}, {}, () => {
      arr.push(3)

      return 'hello'
    })
      .then(() => {
        t.deepEqual(arr, [1, 2, 3, 4, 5])
      })
  })

  t.test('branch middleware by composing', t => {
    const arr: number[] = []

    const fn = compose([
      compose([
        function (ctx: any, next: NextFunction<void>) {
          arr.push(1)

          return next().catch(() => {
            arr.push(3)
          })
        },
        function (ctx: any, next: NextFunction<void>) {
          arr.push(2)

          return Promise.reject<void>(new Error('Boom!'))
        }
      ]),
      function (ctx: any, next: NextFunction<void>) {
        arr.push(4)

        return next()
      }
    ])

    return fn({}, (): void => undefined)
      .then(() => {
        t.deepEqual(arr, [1, 2, 3])
      })
  })

  t.test('throw when input is not an array', t => {
    t.throws(
      () => (compose as any)('test'),
      'Expected middleware to be an array, got string'
    )

    t.end()
  })

  t.test('throw when values are not functions', t => {
    t.throws(
      () => (compose as any)([1, 2, 3]),
      'Expected middleware to contain functions, got number'
    )

    t.end()
  })

  t.test('throw when next is not a function', t => {
    const fn = compose([])

    t.throws(
      () => fn(true as any),
      'Expected the last argument to be `next()`, got boolean'
    )

    t.end()
  })

  t.test('throw when calling next() multiple times', t => {
    const fn = compose([
      function (value: any, next: NextFunction<any>) {
        return next().then(next)
      }
    ])

    t.plan(1)

    return fn({}, (): void => undefined)
      .catch(err => {
        t.equal(err.message, '`next()` called multiple times')
      })
  })
})
