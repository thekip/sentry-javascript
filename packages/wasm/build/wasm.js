(function (__window) {
var exports = {};

Object.defineProperty(exports, '__esModule', { value: true });

var IMAGES = [];
/**
 * Returns the extracted meta information from a web assembly module that
 * Sentry uses to identify debug images.
 *
 * @param module
 */
function getModuleInfo(module) {
    var buildIds = WebAssembly.Module.customSections(module, 'build_id');
    var buildId = null;
    var debugFile = null;
    if (buildIds.length > 0) {
        var firstBuildId = new Uint8Array(buildIds[0]);
        buildId = Array.from(firstBuildId).reduce(function (acc, x) {
            return acc + x.toString(16).padStart(2, '0');
        }, '');
    }
    var externalDebugInfo = WebAssembly.Module.customSections(module, 'external_debug_info');
    if (externalDebugInfo.length > 0) {
        var firstExternalDebugInfo = new Uint8Array(externalDebugInfo[0]);
        var decoder = new TextDecoder('utf-8');
        debugFile = decoder.decode(firstExternalDebugInfo);
    }
    return { buildId: buildId, debugFile: debugFile };
}
/**
 * Records a module
 */
function registerModule(module, url) {
    var _a = getModuleInfo(module), buildId = _a.buildId, debugFile = _a.debugFile;
    if (buildId) {
        var oldIdx = IMAGES.findIndex(function (img) { return img.code_file === url; });
        if (oldIdx >= 0) {
            IMAGES.splice(oldIdx, 1);
        }
        IMAGES.push({
            type: 'wasm',
            code_id: buildId,
            code_file: url,
            debug_file: debugFile ? new URL(debugFile, url).href : null,
            debug_id: buildId.padEnd(32, '0').substr(0, 32) + "0",
        });
    }
}
/**
 * Returns all known images.
 */
function getImages() {
    return IMAGES;
}
/**
 * Looks up an image by URL.
 *
 * @param url the URL of the WebAssembly module.
 */
function getImage(url) {
    return IMAGES.findIndex(function (img) { return img.code_file === url; });
}

/**
 * Patches the web assembly runtime.
 */
function patchWebAssembly() {
    if ('instantiateStreaming' in WebAssembly) {
        var origInstantiateStreaming_1 = WebAssembly.instantiateStreaming;
        WebAssembly.instantiateStreaming = function instantiateStreaming(response, importObject) {
            return Promise.resolve(response).then(function (response) {
                return origInstantiateStreaming_1(response, importObject).then(function (rv) {
                    if (response.url) {
                        registerModule(rv.module, response.url);
                    }
                    return rv;
                });
            });
        };
    }
    if ('compileStreaming' in WebAssembly) {
        var origCompileStreaming_1 = WebAssembly.compileStreaming;
        WebAssembly.compileStreaming = function compileStreaming(source) {
            return Promise.resolve(source).then(function (response) {
                return origCompileStreaming_1(response).then(function (module) {
                    if (response.url) {
                        registerModule(module, response.url);
                    }
                    return module;
                });
            });
        };
    }
}

/** plz don't */
function patchFrames(frames) {
    var haveWasm = false;
    frames.forEach(function (frame) {
        if (!frame.filename) {
            return;
        }
        var match = frame.filename.match(/^(.*?):wasm-function\[\d+\]:(0x[a-fA-F0-9]+)$/);
        if (match !== null) {
            var index = getImage(match[1]);
            if (index >= 0) {
                frame.instruction_addr = match[2];
                frame.addr_mode = "rel:" + index;
                frame.filename = match[1];
                frame.platform = 'native';
                haveWasm = true;
            }
        }
    });
    return haveWasm;
}
/**
 * Process WASM stack traces to support server-side symbolication.
 *
 * This also hooks the WebAssembly loading browser API so that module
 * registraitons are intercepted.
 */
var Wasm = /** @class */ (function () {
    function Wasm() {
        /**
         * @inheritDoc
         */
        this.name = Wasm.id;
    }
    /**
     * @inheritDoc
     */
    Wasm.prototype.setupOnce = function (addGlobalEventProcessor, _getCurrentHub) {
        patchWebAssembly();
        addGlobalEventProcessor(function (event) {
            var _a;
            var haveWasm = false;
            if (event.exception && event.exception.values) {
                event.exception.values.forEach(function (exception) {
                    var _a, _b;
                    if ((_b = (_a = exception) === null || _a === void 0 ? void 0 : _a.stacktrace) === null || _b === void 0 ? void 0 : _b.frames) {
                        haveWasm = haveWasm || patchFrames(exception.stacktrace.frames);
                    }
                });
            }
            if ((_a = event.stacktrace) === null || _a === void 0 ? void 0 : _a.frames) {
                haveWasm = haveWasm || patchFrames(event.stacktrace.frames);
            }
            if (haveWasm) {
                event.debug_meta = event.debug_meta || {};
                event.debug_meta.images = getImages();
            }
            return event;
        });
    };
    /**
     * @inheritDoc
     */
    Wasm.id = 'Wasm';
    return Wasm;
}());

exports.Wasm = Wasm;


  __window.Sentry = __window.Sentry || {};
  __window.Sentry.Integrations = __window.Sentry.Integrations || {};
  for (var key in exports) {
    if (Object.prototype.hasOwnProperty.call(exports, key)) {
      __window.Sentry.Integrations[key] = exports[key];
    }
  }
  
}(window));
//# sourceMappingURL=wasm.js.map
