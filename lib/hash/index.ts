// IMPORTS
// ================================================================================================
import { HashAlgorithm, HashFunction } from '@gow/merkle';
import { sha256, digestSize as sha256DigestSize } from './sha256';

// PUBLIC FUNCTIONS
// ================================================================================================
export function getHashFunction(algorithm: HashAlgorithm): HashFunction {
    switch (algorithm) {
        case 'sha256': {
            return sha256;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}

export function getHashDigestSize(algorithm: HashAlgorithm): number {
    switch (algorithm) {
        case "sha256": {
            return sha256DigestSize;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}