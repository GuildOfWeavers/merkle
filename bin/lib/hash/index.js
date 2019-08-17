"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WasmBlake2s_1 = require("./WasmBlake2s");
const JsHash_1 = require("./JsHash");
// PUBLIC FUNCTIONS
// ================================================================================================
function createHash(algorithm, options) {
    if (options) {
        return new WasmBlake2s_1.WasmBlake2s(options.memory);
    }
    else {
        return new JsHash_1.JsHash(algorithm);
    }
}
exports.createHash = createHash;
//# sourceMappingURL=index.js.map