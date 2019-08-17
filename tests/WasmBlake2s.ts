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
    readonly iRef   : number;
    readonly oRef   : number;
    readonly oEnd   : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(memory?: WebAssembly.Memory) {
        this.wasm = instantiateBlake2s(memory);
        this.iRef = this.wasm.getInputsRef();
        this.oRef = this.wasm.getOutputRef();
        this.oEnd = this.oRef + DIGEST_SIZE;
    }

    // PROPERTY ACCESSORS
    // --------------------------------------------------------------------------------------------
    get algorithm(): HashAlgorithm {
        return "blake2s256";
    }

    get digestSize(): number {
        return DIGEST_SIZE;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    digest(value: Buffer): Buffer {
        if (value.byteLength < 1024) {
            this.wasm.U8.set(value, this.iRef);
            this.wasm.hash3(this.iRef, value.byteLength, this.oRef);
        }
        else {
            const vRef = this.wasm.newArray(value.byteLength);
            this.wasm.U8.set(value, vRef);
            this.wasm.hash3(vRef, value.byteLength, this.oRef);
            this.wasm.__release(vRef);
        }
        return Buffer.from(this.wasm.U8.slice(this.oRef, this.oEnd));
    }

    merge(a: Buffer, b: Buffer): Buffer {
        this.wasm.U8.set(a, this.iRef);
        this.wasm.U8.set(b, this.iRef + a.byteLength);
        this.wasm.hash3(this.iRef, a.byteLength + b.byteLength, this.oRef);
        return Buffer.from(this.wasm.U8.slice(this.oRef, this.oEnd));
    }

    buildMerkleNodes(depth: number, leaves: Buffer[] | WasmArray): ArrayBuffer {

        const wasm = this.wasm, iRef = this.iRef;

        // allocate memory for tree nodes
        const nodeCount = 1 << depth;
        const bufferLength = nodeCount * DIGEST_SIZE;
        const nRef = this.wasm.newArray(bufferLength);
        
        // build first row of internal nodes (parents of leaves)
        const parentCount = nodeCount >>> 1; // nodeCount / 2
        const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
        
        if (Array.isArray(leaves)) {
            // building tree nodes from array of buffers
            let resRef = nRef + parentCount * DIGEST_SIZE;
            for (let i = 0; i < evenLeafCount; i += 2, resRef += DIGEST_SIZE) {
                let leaf1 = leaves[i], leaf2 = leaves[i + 1];
                wasm.U8.set(leaf1, iRef);
                wasm.U8.set(leaf2, iRef + leaf1.length);
                wasm.hash3(iRef, leaf1.length + leaf2.length, resRef);
            }

            // if the number of leaves was odd, process the last leaf
            if (evenLeafCount !== leaves.length) {
                const lastLeaf = leaves[evenLeafCount];
                wasm.U8.set(lastLeaf, iRef);
                wasm.U8.set(Buffer.alloc(DIGEST_SIZE), iRef);
                this.wasm.hash3(iRef, lastLeaf.length + DIGEST_SIZE, resRef);
            }
        }
        else {
            // building tree nodes from an element buffer
            let lBuffer = leaves.toBuffer(), lRef = lBuffer.byteOffset, releaseLeaves = false;
            if (lBuffer.buffer !== wasm.U8.buffer) {
                // if the leaves buffer belongs to some other WASM memory, copy it into local memory
                lRef = wasm.newArray(lBuffer.byteLength);
                lBuffer = leaves.toBuffer(); // get leaves buffer again in case memory has grown
                wasm.U8.set(lBuffer, lRef);
                releaseLeaves = true;
            }
            const resRef = nRef + parentCount * DIGEST_SIZE;
            wasm.hashValues1(lRef, resRef, leaves.elementSize << 1, evenLeafCount >>> 1);

            // if the number of leaves was odd, process the last leaf
            if (evenLeafCount !== leaves.length) {
                const elementSize = leaves.elementSize;
                const lastLeaf = Buffer.from(lBuffer, lBuffer.byteLength - elementSize, elementSize);
                wasm.U8.set(lastLeaf, iRef);
                wasm.U8.set(Buffer.alloc(DIGEST_SIZE), iRef);
                this.wasm.hash3(iRef, lastLeaf.length + DIGEST_SIZE, resRef);
            }

            // if the leaves were copied into local memory, free that memory
            if (releaseLeaves) {
                wasm.__release(lRef);
            }
        }

        // if number of leaves was not a power of 2, assume all other leaves are NULL
        if (leaves.length < nodeCount) {
            const NULL_PARENT = this.merge(Buffer.alloc(DIGEST_SIZE), Buffer.alloc(DIGEST_SIZE));
            for (let i = leaves.length; i < nodeCount; i++) {
                this.wasm.U8.set(NULL_PARENT, nRef + i * DIGEST_SIZE);
            }
        }

        // calculate all other tree nodes
        let tIndex = (parentCount - 1) * DIGEST_SIZE
        let sIndex = tIndex << 1;
        wasm.hashValues2(nRef + sIndex, nRef + tIndex, DIGEST_SIZE << 1, parentCount);

        // copy the buffer out of WASM memory, free the memory, and return the buffer
        const nodes = this.wasm.U8.slice(nRef, nRef + bufferLength);
        this.wasm.__release(nRef);
        return nodes.buffer;
    }
}