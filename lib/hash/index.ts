// IMPORTS
// ================================================================================================
import { HashAlgorithm, Hash, WasmOptions } from '@guildofweavers/merkle';
import { WasmBlake2s } from './WasmBlake2s';
import { JsHash } from './JsHash';

// PUBLIC FUNCTIONS
// ================================================================================================
export function createHash(algorithm: HashAlgorithm, useWasm?: boolean): Hash
export function createHash(algorithm: HashAlgorithm, options: Partial<WasmOptions>): Hash
export function createHash(algorithm: HashAlgorithm, useWasmOrOptions?: boolean | Partial<WasmOptions>): Hash {
    if (useWasmOrOptions) {
        const wasmOptions = (typeof useWasmOrOptions === 'boolean')
            ? {}
            : useWasmOrOptions;

        switch (algorithm) {
            case 'blake2s256': {
                return new WasmBlake2s(wasmOptions.memory);
            }
            default: {
                throw new Error(`WASM-optimization for ${algorithm} hash is not supported`);
            }
        }
    }
    else {
        return new JsHash(algorithm);
    }
}

export function isWasmOptimized(algorithm: HashAlgorithm): boolean {
    switch (algorithm) {
        case 'blake2s256': {
            return true;
        }
        default: {
            return false;
        }
    }
}