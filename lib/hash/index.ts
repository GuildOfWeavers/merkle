// IMPORTS
// ================================================================================================
import { HashAlgorithm, Hash, WasmOptions } from '@guildofweavers/merkle';
import { WasmBlake2s } from './WasmBlake2s';
import { JsHash } from './JsHash';

// PUBLIC FUNCTIONS
// ================================================================================================
export function createHash(algorithm: HashAlgorithm): Hash
export function createHash(algorithm: HashAlgorithm, wasm: boolean): Hash
export function createHash(algorithm: HashAlgorithm, options: Partial<WasmOptions>): Hash
export function createHash(algorithm: HashAlgorithm, optionsOrWasm?: Partial<WasmOptions> | boolean): Hash {
    if (optionsOrWasm) {
        const wasmOptions = (typeof optionsOrWasm === 'boolean')
            ? {}
            : optionsOrWasm;

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