// IMPORTS
// ================================================================================================
import { instantiateBlake2s } from '../assembly';

// MODULE VARIABLES
// ================================================================================================
export const digestSize = 32;

const wasm = instantiateBlake2s();
const i1Ref = wasm.getInput1Ref();
const i2Ref = wasm.getInput2Ref();
const oRef = wasm.getOutputRef();
const oEnd = oRef + digestSize;

const DOUBLE_INPUT_LENGTH = 2 * digestSize;
const NULL_BUFFER = Buffer.alloc(digestSize);
const NULL_PARENT = hash(NULL_BUFFER, NULL_BUFFER);

// PUBLIC FUNCTIONS
// ================================================================================================
export function hash(v1: Buffer, v2?: Buffer): Buffer {
    if (v2 === undefined) {
        if (v1.byteLength === 32) {
            wasm.U8.set(v1, i1Ref);
            wasm.hash1(i1Ref, oRef);
            return Buffer.from(wasm.U8.slice(oRef, oEnd));
        }
        else {
            const vRef = wasm.newArray(v1.byteLength);
            wasm.U8.set(v1, vRef);
            wasm.hash3(vRef, v1.byteLength, oRef);
            wasm.__release(vRef);
            return Buffer.from(wasm.U8.slice(oRef, oEnd));
        }
    }
    else {
        wasm.U8.set(v1, i1Ref);
        wasm.U8.set(v2, i2Ref);
        wasm.hash2(i1Ref, i2Ref, oRef);
        return Buffer.from(wasm.U8.slice(oRef, oEnd));
    }
}


export function buildMerkleTree(depth: number, leaves: Buffer[]): ArrayBuffer {

    // allocate memory for tree nodes
    const nodeCount = 2**depth;
    const bufferLength = nodeCount * digestSize;
    const nRef = wasm.newArray(bufferLength);
    
    // build first row of internal nodes (parents of leaves)
    const parentCount = nodeCount / 2;
    const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
    let i = parentCount;
    for (let j = 0; j < evenLeafCount; j += 2, i++) {
        wasm.U8.set(leaves[j], i1Ref);
        wasm.U8.set(leaves[j + 1], i2Ref);
        wasm.hash2(i1Ref, i2Ref, nRef + i * digestSize);
    }

    // if the number of leaves was odd, process the last leaf
    if (evenLeafCount !== leaves.length) {
        wasm.U8.set(leaves[evenLeafCount], i1Ref);
        wasm.U8.set(NULL_BUFFER, i2Ref);
        wasm.hash2(i1Ref, i2Ref, nRef + i * digestSize);
        i++;
    }

    // if number of leaves was not a power of 2, assume all other leaves are NULL
    while (i < nodeCount) {
        wasm.U8.set(NULL_PARENT, nRef + i * digestSize);
        i++;
    }

    // calculate all other tree nodes
    for (let tIndex = (parentCount - 1) * digestSize; tIndex > 0; tIndex -= digestSize) {
        let sIndex = tIndex << 1;
        wasm.hash3(nRef + sIndex, DOUBLE_INPUT_LENGTH, nRef + tIndex);
    }

    // copy the buffer out of WASM memory, free the memory, and return the buffer
    const nodes = wasm.U8.slice(nRef, nRef + bufferLength);
    wasm.__release(nRef);
    return nodes.buffer;
}