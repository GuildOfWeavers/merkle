"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_1 = require("./sha256");
// PUBLIC FUNCTIONS
// ================================================================================================
function getHashFunction(algorithm) {
    switch (algorithm) {
        case 'sha256': {
            return sha256_1.sha256;
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
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}
exports.getHashDigestSize = getHashDigestSize;
//# sourceMappingURL=index.js.map