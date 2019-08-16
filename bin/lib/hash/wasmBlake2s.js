"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const assembly_1 = require("../assembly");
// MODULE VARIABLES
// ================================================================================================
exports.digestSize = 32;
exports.wasm = assembly_1.instantiateBlake2s();
const i1Ref = exports.wasm.getInput1Ref();
const i2Ref = exports.wasm.getInput2Ref();
const oRef = exports.wasm.getOutputRef();
const oEnd = oRef + exports.digestSize;
const DOUBLE_INPUT_LENGTH = 2 * exports.digestSize;
const NULL_BUFFER = Buffer.alloc(exports.digestSize);
const NULL_PARENT = hash(NULL_BUFFER, NULL_BUFFER);
// PUBLIC FUNCTIONS
// ================================================================================================
function hash(v1, v2) {
    if (v2 === undefined) {
        if (v1.byteLength === 32) {
            exports.wasm.U8.set(v1, i1Ref);
            exports.wasm.hash1(i1Ref, oRef);
            return Buffer.from(exports.wasm.U8.slice(oRef, oEnd));
        }
        else {
            const vRef = exports.wasm.newArray(v1.byteLength);
            exports.wasm.U8.set(v1, vRef);
            exports.wasm.hash3(vRef, v1.byteLength, oRef);
            exports.wasm.__release(vRef);
            return Buffer.from(exports.wasm.U8.slice(oRef, oEnd));
        }
    }
    else {
        exports.wasm.U8.set(v1, i1Ref);
        exports.wasm.U8.set(v2, i2Ref);
        exports.wasm.hash2(i1Ref, i2Ref, oRef);
        return Buffer.from(exports.wasm.U8.slice(oRef, oEnd));
    }
}
exports.hash = hash;
function buildMerkleTree(depth, leaves) {
    // allocate memory for tree nodes
    const nodeCount = 2 ** depth;
    const bufferLength = nodeCount * exports.digestSize;
    const nRef = exports.wasm.newArray(bufferLength);
    // build first row of internal nodes (parents of leaves)
    const parentCount = nodeCount / 2;
    const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
    let i = parentCount;
    for (let j = 0; j < evenLeafCount; j += 2, i++) {
        exports.wasm.U8.set(leaves[j], i1Ref);
        exports.wasm.U8.set(leaves[j + 1], i2Ref);
        exports.wasm.hash2(i1Ref, i2Ref, nRef + i * exports.digestSize);
    }
    // if the number of leaves was odd, process the last leaf
    if (evenLeafCount !== leaves.length) {
        exports.wasm.U8.set(leaves[evenLeafCount], i1Ref);
        exports.wasm.U8.set(NULL_BUFFER, i2Ref);
        exports.wasm.hash2(i1Ref, i2Ref, nRef + i * exports.digestSize);
        i++;
    }
    // if number of leaves was not a power of 2, assume all other leaves are NULL
    while (i < nodeCount) {
        exports.wasm.U8.set(NULL_PARENT, nRef + i * exports.digestSize);
        i++;
    }
    // calculate all other tree nodes
    for (let tIndex = (parentCount - 1) * exports.digestSize; tIndex > 0; tIndex -= exports.digestSize) {
        let sIndex = tIndex << 1;
        exports.wasm.hash3(nRef + sIndex, DOUBLE_INPUT_LENGTH, nRef + tIndex);
    }
    // copy the buffer out of WASM memory, free the memory, and return the buffer
    const nodes = exports.wasm.U8.slice(nRef, nRef + bufferLength);
    exports.wasm.__release(nRef);
    return nodes.buffer;
}
exports.buildMerkleTree = buildMerkleTree;
//# sourceMappingURL=wasmBlake2s.js.map