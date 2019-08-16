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
const DOUBLE_INPUT_LENGTH = 2 * exports.digestSize;
const NULL_BUFFER = Buffer.alloc(exports.digestSize);
const NULL_PARENT = hash(NULL_BUFFER, NULL_BUFFER);
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
function buildMerkleTree(depth, leaves) {
    // allocate memory for tree nodes
    const nodeCount = 2 ** depth;
    const bufferLength = nodeCount * exports.digestSize;
    const nRef = wasm.newArray(bufferLength);
    // build first row of internal nodes (parents of leaves)
    let parentCount = nodeCount / 2;
    const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
    hashLeaves(leaves, nRef + parentCount * exports.digestSize, evenLeafCount);
    // if the number of leaves was odd, process the last leaf
    let i = parentCount + evenLeafCount;
    if (evenLeafCount !== leaves.length) {
        wasm.U8.set(leaves[evenLeafCount], i1Ref);
        wasm.U8.set(NULL_BUFFER, i2Ref);
        wasm.hash2(i1Ref, i2Ref, nRef + i * exports.digestSize);
        i++;
    }
    // if number of leaves was not a power of 2, assume all other leaves are NULL
    while (i < nodeCount) {
        wasm.U8.set(NULL_PARENT, nRef + i * exports.digestSize);
        i++;
    }
    // calculate all other tree nodes
    let tIndex = (parentCount - 1) * exports.digestSize;
    let tRef = nRef + tIndex;
    let sRef = nRef + (tIndex << 1);
    while (parentCount > 1024) {
        parentCount = parentCount / 2;
        hashParents(sRef, tRef, DOUBLE_INPUT_LENGTH, parentCount);
        tIndex = (parentCount - 1) * exports.digestSize;
        tRef = nRef + tIndex;
        sRef = nRef + (tIndex << 1);
    }
    hashParents(sRef, tRef, DOUBLE_INPUT_LENGTH, parentCount);
    // copy the buffer out of WASM memory, free the memory, and return the buffer
    const nodes = wasm.U8.slice(nRef, nRef + bufferLength);
    wasm.__release(nRef);
    return nodes.buffer;
}
exports.buildMerkleTree = buildMerkleTree;
// HELPER FUNCTIONS
// ================================================================================================
function hashLeaves(leaves, resRef, evenLeafCount) {
    for (let j = 0; j < evenLeafCount; j += 2, resRef += exports.digestSize) {
        wasm.U8.set(leaves[j], i1Ref);
        wasm.U8.set(leaves[j + 1], i2Ref);
        wasm.hash2(i1Ref, i2Ref, resRef);
    }
}
function hashParents(vRef, resRef, vElementSize, vElementCount) {
    for (let i = vElementCount - 1; i > 0; i--) {
        wasm.hash3(vRef, vElementSize, resRef);
        vRef -= vElementSize;
        resRef -= exports.digestSize;
    }
}
//# sourceMappingURL=wasmBlake2s.js.map