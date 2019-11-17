// IMPORTS
// ================================================================================================
import * as fs from 'fs';
import * as loader from '@assemblyscript/loader';

// CONSTANTS
// ================================================================================================
const BLAKE2S_WASM = `${__dirname}/blake2s.wasm`;
const IV = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const SIGMA = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
    11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
    7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
    9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
    2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
    12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
    13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
    6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
    10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0];

// INTERFACES
// ================================================================================================
export type WasmBlake2s = loader.ASUtil & {
    getSigmaRef(): number;
    getIvRef(): number;
    getInputsRef(): number; 
    getOutputRef(): number;
    newArray(length: number): number;
    
    hash(vRef: number, vLength: number, resRef: number): void;

    hashValues1(vRef: number, resRef: number, vElementSize: number, vElementCount: number): number;
    hashValues2(vRef: number, resRef: number, vElementSize: number, vElementCount: number): number;

    mergeArrayElements(vRefs: number, resRef: number, vCount: number, vElementCount: number, vElementSize: number): void;

    memory: WebAssembly.Memory;
}

// PUBLIC MODULE
// ================================================================================================
export function instantiateBlake2s(memory?: WebAssembly.Memory): WasmBlake2s {
    if (memory === undefined) {
        memory = new WebAssembly.Memory({ initial: 10 });
    }
    
    const wasm: WasmBlake2s = loader.instantiateSync<any>(fs.readFileSync(BLAKE2S_WASM), {
        env: { memory }
    });

    const memU8 = new Uint8Array(wasm.memory.buffer);
    
    let sIdx = wasm.getSigmaRef();
    for (let sigma of SIGMA) {
        memU8[sIdx] = sigma * 4;
        sIdx++;
    }

    const memU32 = new Uint32Array(wasm.memory.buffer);
    let iIdx = wasm.getIvRef() >> 2;
    for (let iv of IV) {
        memU32[iIdx] = iv;
        iIdx++;
    }

    return wasm;
}