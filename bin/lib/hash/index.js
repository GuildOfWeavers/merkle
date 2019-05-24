"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_1 = require("./sha256");
const blake2s_1 = require("./blake2s");
// PUBLIC FUNCTIONS
// ================================================================================================
function getHashFunction(algorithm) {
    switch (algorithm) {
        case 'sha256': {
            return sha256_1.sha256;
        }
        case 'blake2s256': {
            return blake2s_1.blake2s256;
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
            return sha256_1.digestSize;
        }
        case "blake2s256": {
            return blake2s_1.digestSize;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getHashDigestSize = getHashDigestSize;
//# sourceMappingURL=index.js.map