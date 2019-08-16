// IMPORTS
// ================================================================================================
import { Hash, HashAlgorithm, WasmArray } from "@guildofweavers/merkle";
import { instantiateBlake2s, WasmBlake2s as Blake2sWasm } from '../lib/assembly';

// MODULE VARIABLES
// ================================================================================================
const DIGEST_SIZE = 32; // 32 bytes

// CLASS DEFINITION
// ================================================================================================
export class WasmBlake2s implements Hash {

    readonly wasm   : Blake2sWasm;
    readonly i1Ref  : number
    readonly i2Ref  : number;
    readonly oRef   : number;
    readonly oEnd   : number;

    constructor() {
        this.wasm  = instantiateBlake2s();
        this.i1Ref = this.wasm.getInput1Ref();
        this.i2Ref = this.wasm.getInput2Ref();
        this.oRef  = this.wasm.getOutputRef();
        this.oEnd  = this.oRef + DIGEST_SIZE;
    }

    get algorithm(): HashAlgorithm {
        return "blake2s256";
    }

    get digestSize(): number {
        return DIGEST_SIZE;
    }

    digest(value: Buffer): Buffer {
        if (value.byteLength === 32) {
            this.wasm.U8.set(value, this.i1Ref);
            this.wasm.hash1(this.i1Ref, this.oRef);
            return Buffer.from(this.wasm.U8.slice(this.oRef, this.oEnd));
        }
        else {
            const vRef = this.wasm.newArray(value.byteLength);
            this.wasm.U8.set(value, vRef);
            this.wasm.hash3(vRef, value.byteLength, this.oRef);
            this.wasm.__release(vRef);
            return Buffer.from(this.wasm.U8.slice(this.oRef, this.oEnd));
        }
    }

    merge(a: Buffer, b: Buffer): Buffer {
        this.wasm.U8.set(a, this.i1Ref);
        this.wasm.U8.set(b, this.i2Ref);
        this.wasm.hash2(this.i1Ref, this.i2Ref, this.oRef);
        return Buffer.from(this.wasm.U8.slice(this.oRef, this.oEnd));
    }

    buildMerkleNodes(depth: number, leaves: Buffer[] | WasmArray): Buffer {

        const DOUBLE_INPUT_LENGTH = 2 * DIGEST_SIZE;
        const NULL_BUFFER = Buffer.alloc(DIGEST_SIZE);
        const NULL_PARENT = this.merge(NULL_BUFFER, NULL_BUFFER);

        // allocate memory for tree nodes
        const nodeCount = 2**depth;
        const bufferLength = nodeCount * DIGEST_SIZE;
        const nRef = this.wasm.newArray(bufferLength);
        
        // build first row of internal nodes (parents of leaves)
        const parentCount = nodeCount / 2;
        const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
        let i = parentCount;
        if (Array.isArray(leaves)) {
            for (let j = 0; j < evenLeafCount; j += 2, i++) {
                this.wasm.U8.set(leaves[j], this.i1Ref);
                this.wasm.U8.set(leaves[j + 1], this.i2Ref);
                this.wasm.hash2(this.i1Ref, this.i2Ref, nRef + i * DIGEST_SIZE);
            }
        }
        else {
            let lBuffer = leaves.toBuffer();
            if (lBuffer.buffer !== this.wasm.U8.buffer) {

            }
            lBuffer = leaves.toBuffer();
            let vRef = lBuffer.byteOffset;

            for (let j = 0; j < evenLeafCount; j += 2, i++) {
                
                this.wasm.hash3(vRef, DOUBLE_INPUT_LENGTH, nRef);
            }
        }

        // if the number of leaves was odd, process the last leaf
        /*
        if (evenLeafCount !== leaves.length) {
            this.wasm.U8.set(leaves[evenLeafCount], this.i1Ref);
            this.wasm.U8.set(NULL_BUFFER, this.i2Ref);
            this.wasm.hash2(this.i1Ref, this.i2Ref, nRef + i * DIGEST_SIZE);
            i++;
        }

        // if number of leaves was not a power of 2, assume all other leaves are NULL
        while (i < nodeCount) {
            this.wasm.U8.set(NULL_PARENT, nRef + i * DIGEST_SIZE);
            i++;
        }
        */

        // calculate all other tree nodes
        for (let tIndex = (parentCount - 1) * DIGEST_SIZE; tIndex > 0; tIndex -= DIGEST_SIZE) {
            let sIndex = tIndex << 1;
            this.wasm.hash3(nRef + sIndex, DOUBLE_INPUT_LENGTH, nRef + tIndex);
        }

        // copy the buffer out of WASM memory, free the memory, and return the buffer
        const nodes = Buffer.from(this.wasm.U8.subarray(nRef, nRef + bufferLength));
        this.wasm.__release(nRef);
        return nodes;
    }
}