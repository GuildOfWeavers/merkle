"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const crypto = require("crypto");
// MODULE VARIABLES
// ================================================================================================
exports.digestSize = 32;
const DOUBLE_INPUT_LENGTH = 2 * exports.digestSize;
const NULL_BUFFER = Buffer.alloc(exports.digestSize);
const NULL_PARENT = hash(NULL_BUFFER, NULL_BUFFER);
// PUBLIC FUNCTIONS
// ================================================================================================
function hash(v1, v2) {
    if (v2 === undefined) {
        const hash = crypto.createHash('sha256');
        hash.update(v1);
        return hash.digest();
    }
    else {
        const hash = crypto.createHash('sha256');
        hash.update(v1);
        hash.update(v2);
        return hash.digest();
    }
}
exports.hash = hash;
function buildMerkleTree(depth, leaves) {
    // allocate memory for tree nodes
    const nodeCount = 2 ** depth;
    const nodes = new ArrayBuffer(nodeCount * exports.digestSize);
    const nodeBuffer = Buffer.from(nodes);
    // build first row of internal nodes (parents of values)
    const parentCount = nodeCount / 2;
    const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
    let i = parentCount;
    for (let j = 0; j < evenLeafCount; j += 2, i++) {
        let hash = crypto.createHash('sha256');
        hash.update(leaves[j]);
        hash.update(leaves[j + 1]);
        hash.digest().copy(nodeBuffer, i * exports.digestSize);
    }
    // if the number of leaves was odd, process the last leaf
    if (evenLeafCount !== leaves.length) {
        let hash = crypto.createHash('sha256');
        hash.update(leaves[evenLeafCount]);
        hash.update(NULL_BUFFER);
        hash.digest().copy(nodeBuffer, i * exports.digestSize);
        i++;
    }
    // if number of leaves was not a power of 2, assume all other leaves are NULL
    while (i < nodeCount) {
        NULL_PARENT.copy(nodeBuffer, i * exports.digestSize);
        i++;
    }
    // calculate all other tree nodes
    for (let i = parentCount - 1; i > 0; i--) {
        let tIndex = i * exports.digestSize;
        let sIndex = tIndex << 1;
        let hash = crypto.createHash('sha256');
        hash.update(nodeBuffer.slice(sIndex, sIndex + DOUBLE_INPUT_LENGTH));
        hash.digest().copy(nodeBuffer, tIndex);
    }
    return nodes;
}
exports.buildMerkleTree = buildMerkleTree;
//# sourceMappingURL=sha256.js.map