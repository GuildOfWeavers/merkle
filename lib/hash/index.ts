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
    if (!useWasmOrOptions) {
        return new JsHash(algorithm);
    }

    const HashCtr = getHashConstructor(algorithm);
    if (!HashCtr) {
        return new JsHash(algorithm);
    }

    const wasmOptions = normalizeWasmOptions(useWasmOrOptions);
    return new HashCtr(wasmOptions);
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

// HELPER FUNCTIONS
// ================================================================================================
function getHashConstructor(algorithm: HashAlgorithm) {
    switch (algorithm) {
        case 'blake2s256': {
            return WasmBlake2s;
        }
        default: {
            return undefined;
        }
    }
}

function normalizeWasmOptions(useWasmOrOptions: boolean | Partial<WasmOptions>): WasmOptions {
    if (typeof useWasmOrOptions === 'boolean') {
        return { memory: new WebAssembly.Memory({ initial: 10 }) };
    }

    const memory = useWasmOrOptions.memory || new WebAssembly.Memory({ initial: 10 });
    return { memory };
}