"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha256 = require("./sha256");
const blake2s256 = require("./blake2s");
const wasmBlake2s256 = require("./wasmBlake2s");
// PUBLIC FUNCTIONS
// ================================================================================================
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
function getLeafHasher(algorithm) {
    switch (algorithm) {
        case "sha256": {
            return sha256.hashLeaves;
        }
        case "blake2s256": {
            return blake2s256.hashLeaves;
        }
        case 'wasmBlake2s256': {
            return wasmBlake2s256.hashLeaves;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getLeafHasher = getLeafHasher;
function getNodeHasher(algorithm) {
    switch (algorithm) {
        case "sha256": {
            return sha256.hashNodes;
        }
        case "blake2s256": {
            return blake2s256.hashNodes;
        }
        case 'wasmBlake2s256': {
            return wasmBlake2s256.hashNodes;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getNodeHasher = getNodeHasher;
//# sourceMappingURL=index.js.map