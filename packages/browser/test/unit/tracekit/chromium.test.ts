import { computeStackTrace } from '../../../src/tracekit';

describe('Tracekit - Chrome Tests', () => {
  it('should parse Chrome error with no location', () => {
    const NO_LOCATION = { message: 'foo', name: 'bar', stack: 'error\n at Array.forEach (native)' };
    const stackFrames = computeStackTrace(NO_LOCATION);

    expect(stackFrames).toEqual({
      message: 'foo',
      name: 'bar',
      stack: [{ filename: 'native', function: 'Array.forEach' }],
    });
  });

  it('should parse Chrome 15 error', () => {
    const CHROME_15 = {
      name: 'foo',
      arguments: ['undef'],
      message: "Object #<Object> has no method 'undef'",
      stack:
        "TypeError: Object #<Object> has no method 'undef'\n" +
        '    at bar (http://path/to/file.js:13:17)\n' +
        '    at bar (http://path/to/file.js:16:5)\n' +
        '    at foo (http://path/to/file.js:20:5)\n' +
        '    at http://path/to/file.js:24:4',
    };

    const stackFrames = computeStackTrace(CHROME_15);

    expect(stackFrames).toEqual({
      message: "Object #<Object> has no method 'undef'",
      name: 'foo',
      stack: [
        { filename: 'http://path/to/file.js', function: 'bar', lineno: 13, colno: 17 },
        { filename: 'http://path/to/file.js', function: 'bar', lineno: 16, colno: 5 },
        { filename: 'http://path/to/file.js', function: 'foo', lineno: 20, colno: 5 },
        { filename: 'http://path/to/file.js', function: '?', lineno: 24, colno: 4 },
      ],
    });
  });

  it('should parse Chrome 36 error with port numbers', () => {
    const CHROME_36 = {
      message: 'Default error',
      name: 'Error',
      stack:
        'Error: Default error\n' +
        '    at dumpExceptionError (http://localhost:8080/file.js:41:27)\n' +
        '    at HTMLButtonElement.onclick (http://localhost:8080/file.js:107:146)\n' +
        '    at I.e.fn.(anonymous function) [as index] (http://localhost:8080/file.js:10:3651)',
    };

    const stackFrames = computeStackTrace(CHROME_36);

    expect(stackFrames).toEqual({
      message: 'Default error',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:8080/file.js', function: 'dumpExceptionError', lineno: 41, colno: 27 },
        { filename: 'http://localhost:8080/file.js', function: 'HTMLButtonElement.onclick', lineno: 107, colno: 146 },
        {
          filename: 'http://localhost:8080/file.js',
          function: 'I.e.fn.(anonymous function) [as index]',
          lineno: 10,
          colno: 3651,
        },
      ],
    });
  });

  it('should parse Chrome error with webpack URLs', () => {
    // can be generated when Webpack is built with { devtool: eval }
    const CHROME_XX_WEBPACK = {
      message: "Cannot read property 'error' of undefined",
      name: 'TypeError',
      stack:
        "TypeError: Cannot read property 'error' of undefined\n" +
        '   at TESTTESTTEST.eval(webpack:///./src/components/test/test.jsx?:295:108)\n' +
        '   at TESTTESTTEST.render(webpack:///./src/components/test/test.jsx?:272:32)\n' +
        '   at TESTTESTTEST.tryRender(webpack:///./~/react-transform-catch-errors/lib/index.js?:34:31)\n' +
        '   at TESTTESTTEST.proxiedMethod(webpack:///./~/react-proxy/modules/createPrototypeProxy.js?:44:30)',
    };

    const stackFrames = computeStackTrace(CHROME_XX_WEBPACK);

    expect(stackFrames).toEqual({
      message: "Cannot read property 'error' of undefined",
      name: 'TypeError',
      stack: [
        {
          filename: 'webpack:///./src/components/test/test.jsx?',
          function: 'TESTTESTTEST.eval',
          lineno: 295,
          colno: 108,
        },
        {
          filename: 'webpack:///./src/components/test/test.jsx?',
          function: 'TESTTESTTEST.render',
          lineno: 272,
          colno: 32,
        },
        {
          filename: 'webpack:///./~/react-transform-catch-errors/lib/index.js?',
          function: 'TESTTESTTEST.tryRender',
          lineno: 34,
          colno: 31,
        },
        {
          filename: 'webpack:///./~/react-proxy/modules/createPrototypeProxy.js?',
          function: 'TESTTESTTEST.proxiedMethod',
          lineno: 44,
          colno: 30,
        },
      ],
    });
  });

  it('should parse nested eval() from Chrome', () => {
    const CHROME_48_EVAL = {
      message: 'message string',
      name: 'Error',
      stack:
        'Error: message string\n' +
        'at baz (eval at foo (eval at speak (http://localhost:8080/file.js:21:17)), <anonymous>:1:30)\n' +
        'at foo (eval at speak (http://localhost:8080/file.js:21:17), <anonymous>:2:96)\n' +
        'at eval (eval at speak (http://localhost:8080/file.js:21:17), <anonymous>:4:18)\n' +
        'at Object.speak (http://localhost:8080/file.js:21:17)\n' +
        'at http://localhost:8080/file.js:31:13\n',
    };

    const stackFrames = computeStackTrace(CHROME_48_EVAL);

    expect(stackFrames).toEqual({
      message: 'message string',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:8080/file.js', function: 'baz', lineno: 21, colno: 17 },
        { filename: 'http://localhost:8080/file.js', function: 'foo', lineno: 21, colno: 17 },
        { filename: 'http://localhost:8080/file.js', function: 'eval', lineno: 21, colno: 17 },
        { filename: 'http://localhost:8080/file.js', function: 'Object.speak', lineno: 21, colno: 17 },
        { filename: 'http://localhost:8080/file.js', function: '?', lineno: 31, colno: 13 },
      ],
    });
  });

  it('should parse Chrome error with blob URLs', () => {
    const CHROME_48_BLOB = {
      message: 'Error: test',
      name: 'Error',
      stack:
        'Error: test\n' +
        '    at Error (native)\n' +
        '    at s (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:31:29146)\n' +
        '    at Object.d [as add] (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:31:30039)\n' +
        '    at blob:http%3A//localhost%3A8080/d4eefe0f-361a-4682-b217-76587d9f712a:15:10978\n' +
        '    at blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:1:6911\n' +
        '    at n.fire (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:7:3019)\n' +
        '    at n.handle (blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379:7:2863)',
    };

    const stackFrames = computeStackTrace(CHROME_48_BLOB);

    expect(stackFrames).toEqual({
      message: 'Error: test',
      name: 'Error',
      stack: [
        { filename: 'native', function: 'Error' },
        {
          filename: 'blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379',
          function: 's',
          lineno: 31,
          colno: 29146,
        },
        {
          filename: 'blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379',
          function: 'Object.d [as add]',
          lineno: 31,
          colno: 30039,
        },
        {
          filename: 'blob:http%3A//localhost%3A8080/d4eefe0f-361a-4682-b217-76587d9f712a',
          function: '?',
          lineno: 15,
          colno: 10978,
        },
        {
          filename: 'blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379',
          function: '?',
          lineno: 1,
          colno: 6911,
        },
        {
          filename: 'blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379',
          function: 'n.fire',
          lineno: 7,
          colno: 3019,
        },
        {
          filename: 'blob:http%3A//localhost%3A8080/abfc40e9-4742-44ed-9dcd-af8f99a29379',
          function: 'n.handle',
          lineno: 7,
          colno: 2863,
        },
      ],
    });
  });

  it('should parse errors with custom schemes', () => {
    const CHROMIUM_EMBEDDED_FRAMEWORK_CUSTOM_SCHEME = {
      message: 'message string',
      name: 'Error',
      stack: `Error: message string
            at examplescheme://examplehost/cd351f7250857e22ceaa.worker.js:70179:15`,
    };

    const stacktrace = computeStackTrace(CHROMIUM_EMBEDDED_FRAMEWORK_CUSTOM_SCHEME);

    expect(stacktrace).toEqual({
      message: 'message string',
      name: 'Error',
      stack: [
        {
          filename: 'examplescheme://examplehost/cd351f7250857e22ceaa.worker.js',
          function: '?',
          lineno: 70179,
          colno: 15,
        },
      ],
    });
  });

  it('should parse Chrome 73 with native code frames', () => {
    const CHROME73_NATIVE_CODE_EXCEPTION = {
      message: 'test',
      name: 'Error',
      stack: `Error: test
          at fooIterator (http://localhost:5000/test:20:17)
          at Array.map (<anonymous>)
          at foo (http://localhost:5000/test:19:19)
          at http://localhost:5000/test:24:7`,
    };

    const stacktrace = computeStackTrace(CHROME73_NATIVE_CODE_EXCEPTION);

    expect(stacktrace).toEqual({
      message: 'test',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:5000/test', function: 'fooIterator', lineno: 20, colno: 17 },
        { filename: '<anonymous>', function: 'Array.map' },
        { filename: 'http://localhost:5000/test', function: 'foo', lineno: 19, colno: 19 },
        { filename: 'http://localhost:5000/test', function: '?', lineno: 24, colno: 7 },
      ],
    });
  });

  it('should parse exceptions with eval frames in Chrome 73', () => {
    const CHROME73_EVAL_EXCEPTION = {
      message: 'bad',
      name: 'Error',
      stack: `Error: bad
          at Object.aha (http://localhost:5000/:19:13)
          at callAnotherThing (http://localhost:5000/:20:16)
          at Object.callback (http://localhost:5000/:25:7)
          at http://localhost:5000/:34:17
          at Array.map (<anonymous>)
          at test (http://localhost:5000/:33:23)
          at eval (eval at aha (http://localhost:5000/:37:5), <anonymous>:1:1)
          at aha (http://localhost:5000/:39:5)
          at Foo.testMethod (http://localhost:5000/:44:7)
          at http://localhost:5000/:50:19`,
    };

    const stacktrace = computeStackTrace(CHROME73_EVAL_EXCEPTION);

    expect(stacktrace).toEqual({
      message: 'bad',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:5000/', function: 'Object.aha', lineno: 19, colno: 13 },
        { filename: 'http://localhost:5000/', function: 'callAnotherThing', lineno: 20, colno: 16 },
        { filename: 'http://localhost:5000/', function: 'Object.callback', lineno: 25, colno: 7 },
        { filename: 'http://localhost:5000/', function: '?', lineno: 34, colno: 17 },
        { filename: '<anonymous>', function: 'Array.map' },
        { filename: 'http://localhost:5000/', function: 'test', lineno: 33, colno: 23 },
        { filename: 'http://localhost:5000/', function: 'eval', lineno: 37, colno: 5 },
        { filename: 'http://localhost:5000/', function: 'aha', lineno: 39, colno: 5 },
        { filename: 'http://localhost:5000/', function: 'Foo.testMethod', lineno: 44, colno: 7 },
        { filename: 'http://localhost:5000/', function: '?', lineno: 50, colno: 19 },
      ],
    });
  });

  it('should parse exceptions with native code frames in Edge 44', () => {
    const EDGE44_NATIVE_CODE_EXCEPTION = {
      message: 'test',
      name: 'Error',
      stack: `Error: test
            at fooIterator (http://localhost:5000/test:20:11)
            at Array.prototype.map (native code)
            at foo (http://localhost:5000/test:19:9)
            at Global code (http://localhost:5000/test:24:7)`,
    };

    const stacktrace = computeStackTrace(EDGE44_NATIVE_CODE_EXCEPTION);

    expect(stacktrace).toEqual({
      message: 'test',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:5000/test', function: 'fooIterator', lineno: 20, colno: 11 },
        { filename: 'native code', function: 'Array.prototype.map' },
        { filename: 'http://localhost:5000/test', function: 'foo', lineno: 19, colno: 9 },
        { filename: 'http://localhost:5000/test', function: 'Global code', lineno: 24, colno: 7 },
      ],
    });
  });

  it('should parse exceptions with eval frames in Edge 44', () => {
    const EDGE44_EVAL_EXCEPTION = {
      message: 'aha',
      name: 'Error',
      stack: `Error: bad
            at aha (http://localhost:5000/:19:7)
            at callAnotherThing (http://localhost:5000/:18:6)
            at callback (http://localhost:5000/:25:7)
            at Anonymous function (http://localhost:5000/:34:7)
            at Array.prototype.map (native code)
            at test (http://localhost:5000/:33:5)
            at eval code (eval code:1:1)
            at aha (http://localhost:5000/:39:5)
            at Foo.prototype.testMethod (http://localhost:5000/:44:7)
            at Anonymous function (http://localhost:5000/:50:8)`,
    };

    const stacktrace = computeStackTrace(EDGE44_EVAL_EXCEPTION);

    expect(stacktrace).toEqual({
      message: 'aha',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:5000/', function: 'aha', lineno: 19, colno: 7 },
        { filename: 'http://localhost:5000/', function: 'callAnotherThing', lineno: 18, colno: 6 },
        { filename: 'http://localhost:5000/', function: 'callback', lineno: 25, colno: 7 },
        { filename: 'http://localhost:5000/', function: 'Anonymous function', lineno: 34, colno: 7 },
        { filename: 'native code', function: 'Array.prototype.map' },
        { filename: 'http://localhost:5000/', function: 'test', lineno: 33, colno: 5 },
        { filename: 'eval code', function: 'eval code', lineno: 1, colno: 1 },
        { filename: 'http://localhost:5000/', function: 'aha', lineno: 39, colno: 5 },
        { filename: 'http://localhost:5000/', function: 'Foo.prototype.testMethod', lineno: 44, colno: 7 },
        { filename: 'http://localhost:5000/', function: 'Anonymous function', lineno: 50, colno: 8 },
      ],
    });
  });

  it('should parse exceptions called within an iframe in Electron Renderer', () => {
    const CHROME_ELECTRON_RENDERER = {
      message: "Cannot read property 'error' of undefined",
      name: 'TypeError',
      stack: `TypeError: Cannot read property 'error' of undefined
            at TESTTESTTEST.someMethod (C:\\Users\\user\\path\\to\\file.js:295:108)`,
    };

    const stacktrace = computeStackTrace(CHROME_ELECTRON_RENDERER);

    expect(stacktrace).toEqual({
      message: "Cannot read property 'error' of undefined",
      name: 'TypeError',
      stack: [
        {
          filename: 'C:\\Users\\user\\path\\to\\file.js',
          function: 'TESTTESTTEST.someMethod',
          lineno: 295,
          colno: 108,
        },
      ],
    });
  });
});
