// IMPORTS
// ================================================================================================
import { HashAlgorithm, HashFunction } from '@guildofweavers/merkle';
import * as sha256 from './sha256';
import * as blake2s256 from './blake2s';
import * as wasmBlake2s256 from './wasmBlake2s';

// INTERFACES
// ================================================================================================
export type LeafHasher = (leaf1: Buffer, leaf2: Buffer, target: Buffer, offset: number) => void;
export type NodeHasher = (nodes: Buffer, offset: number) => void;

// PUBLIC FUNCTIONS
// ================================================================================================
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

export function getLeafHasher(algorithm: HashAlgorithm): LeafHasher {
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

export function getNodeHasher(algorithm: HashAlgorithm): NodeHasher {
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