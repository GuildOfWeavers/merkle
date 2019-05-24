// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';

// MODULE VARIABLES
// ================================================================================================
export const digestSize = 32;

// PUBLIC FUNCTIONS
// ================================================================================================
export function blake2s256(v1: Buffer, v2?: Buffer): Buffer {
    if (v2 === undefined) {
        const hash = crypto.createHash('blake2s256');
        hash.update(v1)
        return hash.digest();
    }
    else {
        const hash = crypto.createHash('blake2s256');
        hash.update(v1);
        hash.update(v2);
        return hash.digest();
    }
}