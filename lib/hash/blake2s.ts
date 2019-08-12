// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';

// MODULE VARIABLES
// ================================================================================================
export const digestSize = 32;

// PUBLIC FUNCTIONS
// ================================================================================================
export function hash(v1: Buffer, v2?: Buffer): Buffer {
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

export function hashLeaves(leaf1: Buffer, leaf2: Buffer, target: Buffer, offset: number): void {
    const hash = crypto.createHash('blake2s256');
    hash.update(leaf1);
    hash.update(leaf2);
    hash.digest().copy(target, offset);
}

export function hashNodes(nodes: Buffer, offset: number): void {
    const inputLength = digestSize * 2;
    for (let i = offset; i > 0; i--) {
        let tIndex = i * digestSize;
        let sIndex = tIndex << 1;
        let hash = crypto.createHash('blake2s256');
        hash.update(nodes.slice(sIndex, sIndex + inputLength));
        hash.digest().copy(nodes, tIndex);
    }
}