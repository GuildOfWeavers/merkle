"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WasmBlake2s_1 = require("./WasmBlake2s");
const JsHash_1 = require("./JsHash");
function createHash(algorithm, useWasmOrOptions) {
    if (!useWasmOrOptions) {
        return new JsHash_1.JsHash(algorithm);
    }
    const HashCtr = getHashConstructor(algorithm);
    if (!HashCtr) {
        return new JsHash_1.JsHash(algorithm);
    }
    const wasmOptions = normalizeWasmOptions(useWasmOrOptions);
    return new HashCtr(wasmOptions);
}
exports.createHash = createHash;
function isWasmOptimized(algorithm) {
    switch (algorithm) {
        case 'blake2s256': {
            return true;
        }
        default: {
            return false;
        }
    }
}
exports.isWasmOptimized = isWasmOptimized;
// HELPER FUNCTIONS
// ================================================================================================
function getHashConstructor(algorithm) {
    switch (algorithm) {
        case 'blake2s256': {
            return WasmBlake2s_1.WasmBlake2s;
        }
        default: {
            return undefined;
        }
    }
}
function normalizeWasmOptions(useWasmOrOptions) {
    if (typeof useWasmOrOptions === 'boolean') {
        return { memory: new WebAssembly.Memory({ initial: 10 }) };
    }
    const memory = useWasmOrOptions.memory || new WebAssembly.Memory({ initial: 10 });
    return { memory };
}
//# sourceMappingURL=index.js.map