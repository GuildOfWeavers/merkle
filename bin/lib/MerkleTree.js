"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsVector_1 = require("./JsVector");
// CLASS DEFINITION
// ================================================================================================
class MerkleTree {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    static async createAsync(values, hash) {
        // FUTURE: implement asynchronous instantiation
        return MerkleTree.create(values, hash);
    }
    static create(values, hash) {
        const depth = Math.ceil(Math.log2(values.length));
        const nodes = hash.buildMerkleNodes(depth, values);
        return new MerkleTree(nodes, values, depth, hash.digestSize);
    }
    constructor(nodes, values, depth, nodeSize) {
        this.depth = depth;
        this.nodes = nodes;
        this.nodeSize = nodeSize;
        if (Array.isArray(values)) {
            this.values = new JsVector_1.JsVector(values);
        }
        else {
            this.values = values;
        }
    }
    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get root() {
        return Buffer.from(this.nodes, this.nodeSize, this.nodeSize);
    }
    getLeaf(index) {
        return this.values.toBuffer(index, 1);
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    prove(index) {
        if (index < 0)
            throw new TypeError(`Invalid index: ${index}`);
        if (index > this.values.length)
            throw new TypeError(`Invalid index: ${index}`);
        if (!Number.isInteger(index))
            throw new TypeError(`Invalid index: ${index}`);
        const nodeSize = this.nodeSize;
        const nodeCount = this.nodes.byteLength / nodeSize;
        const value1 = this.values.toBuffer(index, 1);
        const value2 = this.values.toBuffer(index ^ 1, 1);
        const proof = [value1, value2];
        index = (index + nodeCount) >> 1;
        while (index > 1) {
            let sibling = Buffer.from(this.nodes, (index ^ 1) * nodeSize, nodeSize);
            proof.push(sibling);
            index = index >> 1;
        }
        return proof;
    }
    proveBatch(indexes) {
        const nodeSize = this.nodeSize;
        const nodeCount = this.nodes.byteLength / nodeSize;
        const indexMap = mapIndexes(indexes, this.values.length - 1);
        indexes = normalizeIndexes(indexes);
        const proof = {
            values: new Array(indexMap.size),
            nodes: new Array(indexes.length),
            depth: this.depth
        };
        // populate the proof with leaf node values
        let nextIndexes = [];
        for (let i = 0; i < indexes.length; i++) {
            let index = indexes[i];
            let v1 = this.values.toBuffer(index, 1);
            let v2 = this.values.toBuffer(index + 1, 1);
            // only values for indexes that were explicitly requested are included in values array
            const inputIndex1 = indexMap.get(index);
            const inputIndex2 = indexMap.get(index + 1);
            if (inputIndex1 !== undefined) {
                if (inputIndex2 !== undefined) {
                    proof.values[inputIndex1] = v1;
                    proof.values[inputIndex2] = v2;
                    proof.nodes[i] = [];
                }
                else {
                    proof.values[inputIndex1] = v1;
                    proof.nodes[i] = [v2];
                }
            }
            else {
                proof.values[inputIndex2] = v2;
                proof.nodes[i] = [v1];
            }
            nextIndexes.push((index + nodeCount) >> 1);
        }
        // add required internal nodes to the proof, skipping redundancies
        for (let d = this.depth - 1; d > 0; d--) {
            indexes = nextIndexes;
            nextIndexes = [];
            for (let i = 0; i < indexes.length; i++) {
                let siblingIndex = indexes[i] ^ 1;
                if (i + 1 < indexes.length && indexes[i + 1] === siblingIndex) {
                    i++;
                }
                else {
                    let sibling = Buffer.from(this.nodes, siblingIndex * nodeSize, nodeSize);
                    proof.nodes[i].push(sibling);
                }
                // add parent index to the set of next indexes
                nextIndexes.push(siblingIndex >> 1);
            }
        }
        return proof;
    }
    // STATIC METHODS
    // --------------------------------------------------------------------------------------------
    static verify(root, index, proof, hash) {
        const r = index & 1;
        const value1 = proof[r];
        const value2 = proof[1 - r];
        let v = hash.merge(value1, value2);
        index = (index + 2 ** (proof.length - 1)) >> 1;
        for (let i = 2; i < proof.length; i++) {
            if (index & 1) {
                v = hash.merge(proof[i], v);
            }
            else {
                v = hash.merge(v, proof[i]);
            }
            index = index >> 1;
        }
        return root.equals(v);
    }
    static verifyBatch(root, indexes, proof, hash) {
        const v = new Map();
        // replace odd indexes, offset, and sort in ascending order
        const offset = 2 ** proof.depth;
        const indexMap = mapIndexes(indexes, offset - 1);
        indexes = normalizeIndexes(indexes);
        if (indexes.length !== proof.nodes.length)
            return false;
        // for each index use values to compute parent nodes
        let nextIndexes = [];
        const proofPointers = new Array(indexes.length);
        for (let i = 0; i < indexes.length; i++) {
            let index = indexes[i];
            let v1, v2;
            const inputIndex1 = indexMap.get(index);
            const inputIndex2 = indexMap.get(index + 1);
            if (inputIndex1 !== undefined) {
                if (inputIndex2 !== undefined) {
                    v1 = proof.values[inputIndex1];
                    v2 = proof.values[inputIndex2];
                    proofPointers[i] = 0;
                }
                else {
                    v1 = proof.values[inputIndex1];
                    v2 = proof.nodes[i][0];
                    proofPointers[i] = 1;
                }
            }
            else {
                v1 = proof.nodes[i][0];
                v2 = proof.values[inputIndex2];
                proofPointers[i] = 1;
            }
            let parent = hash.merge(v1, v2);
            let parentIndex = (offset + index >> 1);
            v.set(parentIndex, parent);
            nextIndexes.push(parentIndex);
        }
        // iteratively move up, until we get to the root
        for (let d = proof.depth - 1; d > 0; d--) {
            indexes = nextIndexes;
            nextIndexes = [];
            for (let i = 0; i < indexes.length; i++) {
                let nodeIndex = indexes[i];
                let siblingIndex = nodeIndex ^ 1;
                // determine the sibling
                let sibling;
                if (i + 1 < indexes.length && indexes[i + 1] === siblingIndex) {
                    sibling = v.get(siblingIndex);
                    i++;
                }
                else {
                    let pointer = proofPointers[i];
                    sibling = proof.nodes[i][pointer];
                    proofPointers[i] = pointer + 1;
                }
                let node = v.get(nodeIndex);
                // if either node wasn't found, proof fails
                if (node === undefined || sibling === undefined)
                    return false;
                // calculate parent node and add it to the next set of nodes
                let parent = (nodeIndex & 1) ? hash.merge(sibling, node) : hash.merge(node, sibling);
                let parentIndex = nodeIndex >> 1;
                v.set(parentIndex, parent);
                nextIndexes.push(parentIndex);
            }
        }
        return root.equals(v.get(1));
    }
}
exports.MerkleTree = MerkleTree;
// HELPER FUNCTIONS
// ================================================================================================
function normalizeIndexes(input) {
    input = input.slice().sort(compareNumbers);
    const output = new Set();
    for (let index of input) {
        output.add(index - (index & 1));
    }
    return Array.from(output);
}
function mapIndexes(input, maxValid) {
    const output = new Map();
    for (let i = 0; i < input.length; i++) {
        let index = input[i];
        output.set(index, i);
        if (index < 0)
            throw new TypeError(`Invalid index: ${index}`);
        if (index > maxValid)
            throw new TypeError(`Invalid index: ${index}`);
        if (!Number.isInteger(index))
            throw new TypeError(`Invalid index: ${index}`);
    }
    if (input.length !== output.size)
        throw new Error('Repeating indexes detected');
    return output;
}
function compareNumbers(a, b) {
    return a - b;
}
//# sourceMappingURL=MerkleTree.js.map