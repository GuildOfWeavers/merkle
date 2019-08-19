"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WasmBlake2s_1 = require("./WasmBlake2s");
const JsHash_1 = require("./JsHash");
function createHash(algorithm, useWasmOrOptions) {
    if (useWasmOrOptions) {
        const wasmOptions = (typeof useWasmOrOptions === 'boolean')
            ? {}
            : useWasmOrOptions;
        switch (algorithm) {
            case 'blake2s256': {
                return new WasmBlake2s_1.WasmBlake2s(wasmOptions.memory);
            }
            default: {
                throw new Error(`WASM-optimization for ${algorithm} hash is not supported`);
            }
        }
    }
    else {
        return new JsHash_1.JsHash(algorithm);
    }
}
exports.createHash = createHash;
//# sourceMappingURL=index.js.map