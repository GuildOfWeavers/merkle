// IMPORTS
// ================================================================================================
import { HashAlgorithm, Hash, WasmOptions } from '@guildofweavers/merkle';
import { WasmBlake2s } from './WasmBlake2s';
import { JsHash } from './JsHash';

// PUBLIC FUNCTIONS
// ================================================================================================
export function createHash(algorithm: HashAlgorithm, options?: WasmOptions): Hash {
    if (options) {
        return new WasmBlake2s(options.memory);
    }
    else {
        return new JsHash(algorithm);
    }
}