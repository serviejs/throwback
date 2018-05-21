import { compose, Next } from './index'

describe('throwback', () => {
  // Run tests on each code path.
  runTests(false)
  runTests(true)

  describe('debug mode', () => {
    it('should select debug mode based on node env by default', () => {
      const fn = compose([])
      const expectedName = process.env.NODE_ENV !== 'production' ? 'debugComposed' : 'composed'

      expect(fn.name).toEqual(expectedName)
    })
  })

  describe('debug errors', () => {
    it('throw when input is not an array', () => {
      expect(
        () => (compose as any)('test', true)
      ).toThrow(
        'Expected middleware to be an array, got string'
      )
    })

    it('throw when values are not functions', () => {
      expect(
        () => (compose as any)([1, 2, 3], true)
      ).toThrow(
        'Expected middleware to contain functions, but got number'
      )
    })

    it('throw when next is not a function', () => {
      const fn = compose([], true)

      expect(
        () => (fn as any)(true)
      ).toThrow(
        'Expected the last argument to be `done(ctx)`, but got undefined'
      )
    })

    it('throw when calling next() multiple times', async () => {
      const fn = compose([
        function (value: any, next: Next<any, any>) {
          return next().then(() => next())
        }
      ], true)

      await expect(fn({}, () => Promise.resolve())).rejects.toEqual(
        new Error('`next()` called multiple times')
      )
    })

    it('should throw if final function attempts to call `next()`', async () => {
      const fn = compose([], true)

      await expect(fn({}, ((ctx: any, next: any) => next()) as any)).rejects.toEqual(
        new TypeError('Composed `done(ctx)` function should not call `next()`')
      )
    })

    it('should throw if function returns `undefined`', async () => {
      const fn = compose([
        function (ctx) { /* Ignore. */ }
      ], true)

      await expect(fn(true, () => Promise.resolve())).rejects.toEqual(
        new TypeError('Expected middleware to return `next()` or a value')
      )
    })
  })
})

/**
 * Execute tests in each "mode".
 */
function runTests (debugMode: boolean) {
  describe(`compose middleware with debug mode: ${debugMode}`, () => {
    it('should compose middleware functions', async () => {
      const arr: number[] = []

      const fn = compose([
        function (ctx: any, next: Next<any, string>) {
          arr.push(1)

          return next().then(value => {
            arr.push(5)

            expect(value).toEqual('propagate')

            return 'done'
          })
        },
        function (ctx: any, next: Next<any, string>) {
          arr.push(2)

          return next().then(value => {
            arr.push(4)

            expect(value).toEqual('hello')

            return 'propagate'
          })
        }
      ], debugMode)

      await fn({}, () => {
        arr.push(3)

        return 'hello'
      })

      expect(arr).toEqual([1, 2, 3, 4, 5])
    })

    it('branch middleware by composing', async () => {
      const arr: number[] = []

      const fn = compose([
        compose([
          function (ctx: any, next: Next<any, void>) {
            arr.push(1)

            return next().catch(() => {
              arr.push(3)
            })
          },
          function (ctx: any, next: Next<any, void>) {
            arr.push(2)

            return Promise.reject<void>(new Error('Boom!'))
          }
        ], debugMode),
        function (ctx: any, next: Next<any, void>) {
          arr.push(4)

          return next()
        }
      ], debugMode)

      await fn({}, (): void => undefined)

      expect(arr).toEqual([1, 2, 3])
    })

    it('should compose multiple layers', async () => {
      const arr: number[] = []

      function middleware (n: number, next: Next<number, number>) {
        arr.push(n)

        return next(n + 1)
      }

      const fn = compose([
        middleware,
        compose([
          compose([
            middleware,
            middleware
          ], debugMode),
          middleware
        ], debugMode),
        compose([
          middleware
        ], debugMode)
      ], debugMode)

      const res = await fn(0, ctx => ctx)

      expect(res).toEqual(5)
      expect(arr).toEqual([0, 1, 2, 3, 4])
    })

    it('should replace context object', async () => {
      type Ctx = { original: boolean }

      const fn = compose([
        async function (ctx: Ctx, next: Next<Ctx, boolean>) {
          expect(ctx.original).toBe(true)

          const res = await next()

          expect(ctx.original).toBe(true)

          return res
        },
        function (ctx: Ctx, next: Next<Ctx, boolean>) {
          return next({ original: false })
        }
      ], debugMode)

      expect(await fn({ original: true }, ctx => ctx.original)).toEqual(false)
    })
  })
}
