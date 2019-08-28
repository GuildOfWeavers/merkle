"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsVector_1 = require("./vectors/JsVector");
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
        const leaves = Array.isArray(values) ? new JsVector_1.JsVector(values) : values;
        const depth = Math.ceil(Math.log2(leaves.length));
        const nodes = hash.buildMerkleNodes(depth, leaves);
        return new MerkleTree(nodes, leaves, depth, hash.digestSize);
    }
    constructor(nodes, leaves, depth, nodeSize) {
        this.depth = depth;
        this.nodes = Buffer.from(nodes);
        this.nodeSize = nodeSize;
        this.values = leaves;
    }
    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get root() {
        // makes a copy of a node at position 1
        return this.nodes.slice(this.nodeSize, this.nodeSize + this.nodeSize);
    }
    getLeaf(index) {
        // makes a copy of the leaf value
        return Buffer.from(this.values.toBuffer(index, 1));
    }
    getLeaves() {
        // makes a deep copy of all leaves
        const leaves = new Array(this.values.length);
        for (let i = 0; i < leaves.length; i++) {
            leaves[i] = Buffer.from(this.values.toBuffer(i, 1));
        }
        return leaves;
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
        const value1 = this.getLeaf(index);
        const value2 = this.getLeaf(index ^ 1);
        const proof = [value1, value2];
        index = (index + nodeCount) >> 1;
        while (index > 1) {
            let siblingOffset = (index ^ 1) * nodeSize;
            let sibling = this.nodes.slice(siblingOffset, siblingOffset + nodeSize);
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
            let v1 = this.getLeaf(index);
            let v2 = this.getLeaf(index + 1);
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
                    let siblingOffset = siblingIndex * nodeSize;
                    let sibling = this.nodes.slice(siblingOffset, siblingOffset + nodeSize);
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
            // if either value wasn't found, proof fails
            if (v1 === undefined || v2 === undefined)
                return false;
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