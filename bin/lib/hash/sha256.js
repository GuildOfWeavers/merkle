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
function sha256(v1, v2) {
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
exports.sha256 = sha256;
//# sourceMappingURL=sha256.js.map