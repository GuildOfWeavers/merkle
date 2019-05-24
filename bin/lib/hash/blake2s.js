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
function blake2s256(v1, v2) {
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
exports.blake2s256 = blake2s256;
//# sourceMappingURL=blake2s.js.map