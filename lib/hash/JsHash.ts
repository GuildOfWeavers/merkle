// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';
import { Hash, HashAlgorithm, Vector } from "@guildofweavers/merkle";
import { JsVector } from '../JsVector';

// MODULE VARIABLES
// ================================================================================================
const DIGEST_SIZE = 32; // 32 bytes
const DOUBLE_INPUT_LENGTH = 2 * DIGEST_SIZE;
const NULL_BUFFER = Buffer.alloc(DIGEST_SIZE);

// CLASS DEFINITION
// ================================================================================================
export class JsHash implements Hash {

    readonly algorithm: HashAlgorithm

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(algorithm: HashAlgorithm) {
        this.algorithm = algorithm;
    }

    // PROPERTY ACCESSORS
    // --------------------------------------------------------------------------------------------
    get digestSize(): number {
        return DIGEST_SIZE;
    }

    get isOptimized(): boolean {
        return false;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    digest(value: Buffer): Buffer {
        const hash = crypto.createHash(this.algorithm);
        hash.update(value)
        return hash.digest();
    }

    merge(a: Buffer, b: Buffer): Buffer {
        const hash = crypto.createHash(this.algorithm);
        hash.update(a);
        hash.update(b);
        return hash.digest();
    }

    buildMerkleNodes(depth: number, leaves: Vector): ArrayBuffer {

        // allocate memory for tree nodes
        const nodeCount = 2**depth;
        const nodes = new ArrayBuffer(nodeCount * DIGEST_SIZE);
        const nodeBuffer = Buffer.from(nodes);

        // build first row of internal nodes (parents of leaves)
        const parentCount = nodeCount / 2;
        const evenLeafCount = (leaves.length & 1) ? leaves.length - 1 : leaves.length;
        let tOffset = parentCount * DIGEST_SIZE;

        const lBuffer = leaves.toBuffer();
        const doubleElementSize = leaves.elementSize * 2;
        let sOffset = 0;
        for (let i = 0; i < evenLeafCount; i += 2, sOffset += doubleElementSize, tOffset += DIGEST_SIZE) {
            let hash = crypto.createHash(this.algorithm);
            hash.update(lBuffer.slice(sOffset, sOffset + doubleElementSize));
            hash.digest().copy(nodeBuffer, tOffset);
        }

        // if the number of leaves was odd, process the last leaf
        if (evenLeafCount !== leaves.length) {
            let hash = crypto.createHash(this.algorithm);
            hash.update(lBuffer.slice(sOffset));
            hash.update(NULL_BUFFER);
            hash.digest().copy(nodeBuffer, tOffset);
            tOffset += DIGEST_SIZE;
        }

        // if number of leaves was not a power of 2, assume all other leaves are NULL
        if (leaves.length < nodeCount) {
            const nullParent = this.merge(NULL_BUFFER, NULL_BUFFER);
            while (tOffset < nodes.byteLength) {
                nullParent.copy(nodeBuffer, tOffset);
                tOffset += DIGEST_SIZE;
            }
        }

        // calculate all other tree nodes
        for (let i = parentCount - 1; i > 0; i--) {
            let tIndex = i * DIGEST_SIZE;
            let sIndex = tIndex << 1;
            let hash = crypto.createHash(this.algorithm);
            hash.update(nodeBuffer.slice(sIndex, sIndex + DOUBLE_INPUT_LENGTH));
            hash.digest().copy(nodeBuffer, tIndex);
        }

        return nodes;
    }

    mergeVectorRows(vectors: Vector[]): Vector {
        const elementCount = vectors[0].length;
        const elementSize  = vectors[0].elementSize;

        const result = new Array<Buffer>(elementCount);
        const buffer = Buffer.allocUnsafe(vectors.length * elementSize);
        for (let i = 0; i < elementCount; i++) {
            let offset = 0;
            for (let j = 0; j < vectors.length; j++) {
                offset += vectors[j].copyValue(i, buffer, offset);
            }
            result[i] = this.digest(buffer);
        }
        return new JsVector(result);
    }
}