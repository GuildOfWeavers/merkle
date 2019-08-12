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
const oEnd = oRef + exports.digestSize;
// PUBLIC FUNCTIONS
// ================================================================================================
function hash(v1, v2) {
    if (v2 === undefined) {
        if (v1.byteLength === 32) {
            wasm.U8.set(v1, i1Ref);
            wasm.hash1(i1Ref, oRef);
            return Buffer.from(wasm.U8.slice(oRef, oEnd));
        }
        else {
            const vRef = wasm.newArray(v1.byteLength);
            wasm.U8.set(v1, vRef);
            wasm.hash3(vRef, v1.byteLength, oRef);
            wasm.__release(vRef);
            return Buffer.from(wasm.U8.slice(oRef, oEnd));
        }
    }
    else {
        wasm.U8.set(v1, i1Ref);
        wasm.U8.set(v2, i2Ref);
        wasm.hash2(i1Ref, i2Ref, oRef);
        return Buffer.from(wasm.U8.slice(oRef, oEnd));
    }
}
exports.hash = hash;
function hashLeaves(leaf1, leaf2, target, offset) {
    wasm.U8.set(leaf1, i1Ref);
    wasm.U8.set(leaf2, i2Ref);
    wasm.hash2(i1Ref, i2Ref, oRef);
    target.set(wasm.U8.slice(oRef, oEnd), offset);
}
exports.hashLeaves = hashLeaves;
function hashNodes(nodes, offset) {
    const inputLength = exports.digestSize * 2;
    const vRef = wasm.newArray(inputLength);
    for (let tIndex = offset * exports.digestSize; tIndex > 0; tIndex -= exports.digestSize) {
        let sIndex = tIndex << 1;
        wasm.U8.set(nodes.slice(sIndex, sIndex + inputLength), vRef);
        wasm.hash3(vRef, inputLength, oRef);
        nodes.set(wasm.U8.slice(oRef, oEnd), tIndex);
    }
    wasm.__release(vRef);
}
exports.hashNodes = hashNodes;
//# sourceMappingURL=wasmBlake2s.js.map