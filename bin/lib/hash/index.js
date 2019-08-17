"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha256 = require("./sha256");
const blake2s256 = require("./blake2s");
const wasmBlake2s256 = require("./wasmBlake2s");
const JsHash_1 = require("./JsHash");
// PUBLIC FUNCTIONS
// ================================================================================================
function createHash(algorithm) {
    return new JsHash_1.JsHash(algorithm);
}
exports.createHash = createHash;
function getHashFunction(algorithm) {
    switch (algorithm) {
        case 'sha256': {
            return sha256.hash;
        }
        case 'blake2s256': {
            return blake2s256.hash;
        }
        case 'wasmBlake2s256': {
            return wasmBlake2s256.hash;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getHashFunction = getHashFunction;
function getHashDigestSize(algorithm) {
    switch (algorithm) {
        case "sha256": {
            return sha256.digestSize;
        }
        case "blake2s256": {
            return blake2s256.digestSize;
        }
        case 'wasmBlake2s256': {
            return wasmBlake2s256.digestSize;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getHashDigestSize = getHashDigestSize;
function getMerkleTreeBuilder(algorithm) {
    switch (algorithm) {
        case "sha256": {
            return sha256.buildMerkleTree;
        }
        case "blake2s256": {
            return blake2s256.buildMerkleTree;
        }
        case 'wasmBlake2s256': {
            return wasmBlake2s256.buildMerkleTree;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getMerkleTreeBuilder = getMerkleTreeBuilder;
//# sourceMappingURL=index.js.map