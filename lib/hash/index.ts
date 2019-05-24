// IMPORTS
// ================================================================================================
import { HashAlgorithm, HashFunction } from '@guildofweavers/merkle';
import { sha256, digestSize as sha256ds } from './sha256';
import { blake2s256, digestSize as blake2s256ds } from './blake2s';

// PUBLIC FUNCTIONS
// ================================================================================================
export function getHashFunction(algorithm: HashAlgorithm): HashFunction {
    switch (algorithm) {
        case 'sha256': {
            return sha256;
        }
        case 'blake2s256': {
            return blake2s256;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}

export function getHashDigestSize(algorithm: HashAlgorithm): number {
    switch (algorithm) {
        case "sha256": {
            return sha256ds;
        }
        case "blake2s256": {
            return blake2s256ds;
        }
        default: {
            throw new TypeError('Invalid hash algorithm');
        }
    }
}