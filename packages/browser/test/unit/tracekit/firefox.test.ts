import { computeStackTrace } from '../../../src/tracekit';

describe('Tracekit - Firefox Tests', () => {
  it('should parse Firefox 3 error', () => {
    const FIREFOX_3 = {
      fileName: 'http://127.0.0.1:8000/js/stacktrace.js',
      lineNumber: 44,
      message: 'this.undef is not a function',
      name: 'TypeError',
      stack:
        '()@http://127.0.0.1:8000/js/stacktrace.js:44\n' +
        '(null)@http://127.0.0.1:8000/js/stacktrace.js:31\n' +
        'printStackTrace()@http://127.0.0.1:8000/js/stacktrace.js:18\n' +
        'bar(1)@http://127.0.0.1:8000/js/file.js:13\n' +
        'bar(2)@http://127.0.0.1:8000/js/file.js:16\n' +
        'foo()@http://127.0.0.1:8000/js/file.js:20\n' +
        '@http://127.0.0.1:8000/js/file.js:24\n' +
        '',
    };

    const stackFrames = computeStackTrace(FIREFOX_3);

    expect(stackFrames).toEqual({
      message: 'this.undef is not a function',
      name: 'TypeError',
      stack: [
        { filename: 'http://127.0.0.1:8000/js/stacktrace.js', function: '?', lineno: 44 },
        { filename: 'http://127.0.0.1:8000/js/stacktrace.js', function: '?', lineno: 31 },
        {
          filename: 'http://127.0.0.1:8000/js/stacktrace.js',
          function: 'printStackTrace',
          lineno: 18,
        },
        { filename: 'http://127.0.0.1:8000/js/file.js', function: 'bar', lineno: 13 },
        { filename: 'http://127.0.0.1:8000/js/file.js', function: 'bar', lineno: 16 },
        { filename: 'http://127.0.0.1:8000/js/file.js', function: 'foo', lineno: 20 },
        { filename: 'http://127.0.0.1:8000/js/file.js', function: '?', lineno: 24 },
      ],
    });
  });

  it('should parse Firefox 7 error', () => {
    const FIREFOX_7 = {
      name: 'foo',
      message: 'bar',
      fileName: 'file:///G:/js/stacktrace.js',
      lineNumber: 44,
      stack:
        '()@file:///G:/js/stacktrace.js:44\n' +
        '(null)@file:///G:/js/stacktrace.js:31\n' +
        'printStackTrace()@file:///G:/js/stacktrace.js:18\n' +
        'bar(1)@file:///G:/js/file.js:13\n' +
        'bar(2)@file:///G:/js/file.js:16\n' +
        'foo()@file:///G:/js/file.js:20\n' +
        '@file:///G:/js/file.js:24\n' +
        '',
    };

    const stackFrames = computeStackTrace(FIREFOX_7);

    expect(stackFrames).toEqual({
      message: 'bar',
      name: 'foo',
      stack: [
        { filename: 'file:///G:/js/stacktrace.js', function: '?', lineno: 44 },
        { filename: 'file:///G:/js/stacktrace.js', function: '?', lineno: 31 },
        { filename: 'file:///G:/js/stacktrace.js', function: 'printStackTrace', lineno: 18 },
        { filename: 'file:///G:/js/file.js', function: 'bar', lineno: 13 },
        { filename: 'file:///G:/js/file.js', function: 'bar', lineno: 16 },
        { filename: 'file:///G:/js/file.js', function: 'foo', lineno: 20 },
        { filename: 'file:///G:/js/file.js', function: '?', lineno: 24 },
      ],
    });
  });

  it('should parse Firefox 14 error', () => {
    const FIREFOX_14 = {
      name: 'foo',
      message: 'x is null',
      stack:
        '@http://path/to/file.js:48\n' +
        'dumpException3@http://path/to/file.js:52\n' +
        'onclick@http://path/to/file.js:1\n' +
        '',
      fileName: 'http://path/to/file.js',
      lineNumber: 48,
    };

    const stackFrames = computeStackTrace(FIREFOX_14);

    expect(stackFrames).toEqual({
      message: 'x is null',
      name: 'foo',
      stack: [
        { filename: 'http://path/to/file.js', function: '?', lineno: 48 },
        { filename: 'http://path/to/file.js', function: 'dumpException3', lineno: 52 },
        { filename: 'http://path/to/file.js', function: 'onclick', lineno: 1 },
      ],
    });
  });

  it('should parse Firefox 31 error', () => {
    const FIREFOX_31 = {
      message: 'Default error',
      name: 'Error',
      stack:
        'foo@http://path/to/file.js:41:13\n' +
        'bar@http://path/to/file.js:1:1\n' +
        '.plugin/e.fn[c]/<@http://path/to/file.js:1:1\n' +
        '',
      fileName: 'http://path/to/file.js',
      lineNumber: 41,
      columnNumber: 12,
    };

    const stackFrames = computeStackTrace(FIREFOX_31);

    expect(stackFrames).toEqual({
      message: 'Default error',
      name: 'Error',
      stack: [
        { filename: 'http://path/to/file.js', function: 'foo', lineno: 41, colno: 13 },
        { filename: 'http://path/to/file.js', function: 'bar', lineno: 1, colno: 1 },
        { filename: 'http://path/to/file.js', function: '.plugin/e.fn[c]/<', lineno: 1, colno: 1 },
      ],
    });
  });

  it('should parse Firefox 44 ns exceptions', () => {
    // Internal errors sometimes thrown by Firefox
    // More here: https://developer.mozilla.org/en-US/docs/Mozilla/Errors
    //
    // Note that such errors are instanceof "Exception", not "Error"
    const FIREFOX_44_NS_EXCEPTION = {
      message: '',
      name: 'NS_ERROR_FAILURE',
      stack:
        '[2]</Bar.prototype._baz/</<@http://path/to/file.js:703:28\n' +
        'App.prototype.foo@file:///path/to/file.js:15:2\n' +
        'bar@file:///path/to/file.js:20:3\n' +
        '@file:///path/to/index.html:23:1\n' + // inside <script> tag
        '',
      fileName: 'http://path/to/file.js',
      columnNumber: 0,
      lineNumber: 703,
      result: 2147500037,
    };

    const stackFrames = computeStackTrace(FIREFOX_44_NS_EXCEPTION);

    expect(stackFrames).toEqual({
      message: 'No error message',
      name: 'NS_ERROR_FAILURE',
      stack: [
        { filename: 'http://path/to/file.js', function: '[2]</Bar.prototype._baz/</<', lineno: 703, colno: 28 },
        { filename: 'file:///path/to/file.js', function: 'App.prototype.foo', lineno: 15, colno: 2 },
        { filename: 'file:///path/to/file.js', function: 'bar', lineno: 20, colno: 3 },
        { filename: 'file:///path/to/index.html', function: '?', lineno: 23, colno: 1 },
      ],
    });
  });

  it('should parse Firefox errors with resource: URLs', () => {
    const FIREFOX_50_RESOURCE_URL = {
      stack:
        'render@resource://path/data/content/bundle.js:5529:16\n' +
        'dispatchEvent@resource://path/data/content/vendor.bundle.js:18:23028\n' +
        'wrapped@resource://path/data/content/bundle.js:7270:25',
      fileName: 'resource://path/data/content/bundle.js',
      lineNumber: 5529,
      columnNumber: 16,
      message: 'this.props.raw[this.state.dataSource].rows is undefined',
      name: 'TypeError',
    };

    const stackFrames = computeStackTrace(FIREFOX_50_RESOURCE_URL);

    expect(stackFrames).toEqual({
      message: 'this.props.raw[this.state.dataSource].rows is undefined',
      name: 'TypeError',
      stack: [
        { filename: 'resource://path/data/content/bundle.js', function: 'render', lineno: 5529, colno: 16 },
        {
          filename: 'resource://path/data/content/vendor.bundle.js',
          function: 'dispatchEvent',
          lineno: 18,
          colno: 23028,
        },
        { filename: 'resource://path/data/content/bundle.js', function: 'wrapped', lineno: 7270, colno: 25 },
      ],
    });
  });

  it('should parse Firefox errors with eval URLs', () => {
    const FIREFOX_43_EVAL = {
      name: 'foo',
      columnNumber: 30,
      fileName: 'http://localhost:8080/file.js line 25 > eval line 2 > eval',
      lineNumber: 1,
      message: 'message string',
      stack:
        'baz@http://localhost:8080/file.js line 26 > eval line 2 > eval:1:30\n' +
        'foo@http://localhost:8080/file.js line 26 > eval:2:96\n' +
        '@http://localhost:8080/file.js line 26 > eval:4:18\n' +
        'speak@http://localhost:8080/file.js:26:17\n' +
        '@http://localhost:8080/file.js:33:9',
    };

    const stackFrames = computeStackTrace(FIREFOX_43_EVAL);

    expect(stackFrames).toEqual({
      message: 'message string',
      name: 'foo',
      stack: [
        { filename: 'http://localhost:8080/file.js', function: 'baz', lineno: 26 },
        { filename: 'http://localhost:8080/file.js', function: 'foo', lineno: 26 },
        { filename: 'http://localhost:8080/file.js', function: 'eval', lineno: 26 },
        { filename: 'http://localhost:8080/file.js', function: 'speak', lineno: 26, colno: 17 },
        { filename: 'http://localhost:8080/file.js', function: '?', lineno: 33, colno: 9 },
      ],
    });
  });

  it('should parse exceptions with native code frames in Firefox 66', () => {
    const FIREFOX66_NATIVE_CODE_EXCEPTION = {
      message: 'test',
      name: 'Error',
      stack: `fooIterator@http://localhost:5000/test:20:17
          foo@http://localhost:5000/test:19:19
          @http://localhost:5000/test:24:7`,
    };

    const stacktrace = computeStackTrace(FIREFOX66_NATIVE_CODE_EXCEPTION);

    expect(stacktrace).toEqual({
      message: 'test',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:5000/test', function: 'fooIterator', lineno: 20, colno: 17 },
        { filename: 'http://localhost:5000/test', function: 'foo', lineno: 19, colno: 19 },
        { filename: 'http://localhost:5000/test', function: '?', lineno: 24, colno: 7 },
      ],
    });
  });

  it('should parse exceptions with eval frames in Firefox 66', () => {
    const FIREFOX66_EVAL_EXCEPTION = {
      message: 'aha',
      name: 'Error',
      stack: `aha@http://localhost:5000/:19:13
          callAnotherThing@http://localhost:5000/:20:15
          callback@http://localhost:5000/:25:7
          test/<@http://localhost:5000/:34:7
          test@http://localhost:5000/:33:23
          @http://localhost:5000/ line 39 > eval:1:1
          aha@http://localhost:5000/:39:5
          testMethod@http://localhost:5000/:44:7
          @http://localhost:5000/:50:19`,
    };

    const stacktrace = computeStackTrace(FIREFOX66_EVAL_EXCEPTION);

    expect(stacktrace).toEqual({
      message: 'aha',
      name: 'Error',
      stack: [
        { filename: 'http://localhost:5000/', function: 'aha', lineno: 19, colno: 13 },
        { filename: 'http://localhost:5000/', function: 'callAnotherThing', lineno: 20, colno: 15 },
        { filename: 'http://localhost:5000/', function: 'callback', lineno: 25, colno: 7 },
        { filename: 'http://localhost:5000/', function: 'test/<', lineno: 34, colno: 7 },
        { filename: 'http://localhost:5000/', function: 'test', lineno: 33, colno: 23 },
        { filename: 'http://localhost:5000/', function: 'eval', lineno: 39 },
        { filename: 'http://localhost:5000/', function: 'aha', lineno: 39, colno: 5 },
        { filename: 'http://localhost:5000/', function: 'testMethod', lineno: 44, colno: 7 },
        { filename: 'http://localhost:5000/', function: '?', lineno: 50, colno: 19 },
      ],
    });
  });
});
