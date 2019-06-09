import { compose, Next } from "./index";

describe("throwback", () => {
  // Run tests on each code path.
  runTests("production");
  runTests("development");

  describe("debug mode", () => {
    it("should select debug mode based on node env by default", () => {
      const fn = compose([]);

      expect(fn.name).toEqual("composedDebug");
    });
  });

  describe("debug errors", () => {
    it("throw when input is not an array", () => {
      expect(() => (compose as any)("test", true)).toThrow(
        "Expected middleware to be an array, got string"
      );
    });

    it("throw when values are not functions", () => {
      expect(() => (compose as any)([1, 2, 3], true)).toThrow(
        "Expected middleware to contain functions, but got number"
      );
    });

    it("throw when done is not a function", () => {
      const fn = compose([]);

      expect(() => (fn as any)(true)).toThrow(
        "Expected the last argument to be `done(ctx)`, but got undefined"
      );
    });

    it("throw when calling `next()` multiple times", async () => {
      const fn = compose([
        function(value: any, next: Next<any>) {
          return next().then(() => next());
        }
      ]);

      await expect(fn({}, () => Promise.resolve())).rejects.toEqual(
        new Error("`next()` called multiple times")
      );
    });

    it("should throw if final function attempts to call `next()`", async () => {
      const fn = compose([]);

      await expect(
        fn({}, ((ctx: any, next: any) => next()) as any)
      ).rejects.toEqual(
        new TypeError("Composed `done(ctx)` function should not call `next()`")
      );
    });

    it("should throw if function returns `undefined`", async () => {
      const fn = compose([
        function(ctx) {
          /* Ignore. */
        }
      ]);

      await expect(fn(true, () => Promise.resolve())).rejects.toEqual(
        new TypeError("Expected middleware to return `next()` or a value")
      );
    });
  });
});

/**
 * Execute tests in each "mode".
 */
function runTests(nodeEnv: string) {
  jest.resetModules()

  process.env.NODE_ENV = nodeEnv;

  const { compose } = require('./index');

  describe(`compose middleware with env ${nodeEnv}`, () => {
    it("should select debug mode based on node env by default", () => {
      const fn = compose([]);
      const expectedName =
        nodeEnv === "production" ? "composed" : "composedDebug";

      expect(fn.name).toEqual(expectedName);
    });

    it("should compose middleware functions", async () => {
      const arr: number[] = [];

      const fn = compose([
        function(ctx: any, next: Next<string>) {
          arr.push(1);

          return next().then(value => {
            arr.push(5);

            expect(value).toEqual("propagate");

            return "done";
          });
        },
        function(ctx: any, next: Next<string>) {
          arr.push(2);

          return next().then(value => {
            arr.push(4);

            expect(value).toEqual("hello");

            return "propagate";
          });
        }
      ]);

      await fn({}, () => {
        arr.push(3);

        return "hello";
      });

      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });

    it("branch middleware by composing", async () => {
      const arr: number[] = [];

      const fn = compose([
        compose([
          function(ctx: any, next: Next<void>) {
            arr.push(1);

            return next().catch(() => {
              arr.push(3);
            });
          },
          function(ctx: any, next: Next<void>) {
            arr.push(2);

            return Promise.reject<void>(new Error("Boom!"));
          }
        ]),
        function(ctx: any, next: Next<void>) {
          arr.push(4);

          return next();
        }
      ]);

      await fn({}, (): void => undefined);

      expect(arr).toEqual([1, 2, 3]);
    });
  });
}
