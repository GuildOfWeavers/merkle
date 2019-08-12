"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const crypto = require("crypto");
// MODULE VARIABLES
// ================================================================================================
exports.digestSize = 32;
// PUBLIC FUNCTIONS
// ================================================================================================
function hash(v1, v2) {
    if (v2 === undefined) {
        const hash = crypto.createHash('blake2s256');
        hash.update(v1);
        return hash.digest();
    }
    else {
        const hash = crypto.createHash('blake2s256');
        hash.update(v1);
        hash.update(v2);
        return hash.digest();
    }
}
exports.hash = hash;
function hashLeaves(leaf1, leaf2, target, offset) {
    const hash = crypto.createHash('blake2s256');
    hash.update(leaf1);
    hash.update(leaf2);
    hash.digest().copy(target, offset);
}
exports.hashLeaves = hashLeaves;
function hashNodes(nodes, offset) {
    const inputLength = exports.digestSize * 2;
    for (let i = offset; i > 0; i--) {
        let tIndex = i * exports.digestSize;
        let sIndex = tIndex << 1;
        let hash = crypto.createHash('blake2s256');
        hash.update(nodes.slice(sIndex, sIndex + inputLength));
        hash.digest().copy(nodes, tIndex);
    }
}
exports.hashNodes = hashNodes;
//# sourceMappingURL=blake2s.js.map