"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const assembly_1 = require("../assembly");
// MODULE VARIABLES
// ================================================================================================
exports.digestSize = 32;
const wasm = assembly_1.instantiateBlake2s();
const i1Ref = wasm.getInput1Ref();
const i2Ref = wasm.getInput2Ref();
const oRef = wasm.getOutputRef();
// PUBLIC FUNCTIONS
// ================================================================================================
function wasmBlake2s256(v1, v2) {
    if (v2 === undefined) {
        wasm.U8.set(v1, i1Ref);
        wasm.hash1(i1Ref, oRef);
        return Buffer.from(wasm.U8.slice(oRef, oRef + exports.digestSize));
    }
    else {
        wasm.U8.set(v1, i1Ref);
        wasm.U8.set(v2, i2Ref);
        wasm.hash2(i1Ref, i2Ref, oRef);
        return Buffer.from(wasm.U8.slice(oRef, oRef + exports.digestSize));
    }
}
exports.wasmBlake2s256 = wasmBlake2s256;
//# sourceMappingURL=wasmBlake2s.js.map