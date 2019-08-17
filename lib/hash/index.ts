// IMPORTS
// ================================================================================================
import { HashAlgorithm, HashFunction, Hash } from '@guildofweavers/merkle';
import * as sha256 from './sha256';
import * as blake2s256 from './blake2s';
import * as wasmBlake2s256 from './wasmBlake2s';
import { JsHash } from './JsHash';

// INTERFACES
// ================================================================================================
export type MerkleTreeBuilder = (depth: number, leaves: Buffer[]) => ArrayBuffer;

// PUBLIC FUNCTIONS
// ================================================================================================
export function createHash(algorithm: HashAlgorithm): Hash {
    return new JsHash(algorithm);
}

export function getHashFunction(algorithm: HashAlgorithm): HashFunction {
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

export function getHashDigestSize(algorithm: HashAlgorithm): number {
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

export function getMerkleTreeBuilder(algorithm: HashAlgorithm): MerkleTreeBuilder {
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