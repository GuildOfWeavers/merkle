// IMPORTS
// ================================================================================================
import * as assert from 'assert';
import { MerkleTree } from '../lib/MerkleTree';

// MODULE VARIABLES
// ================================================================================================
const iterations = 100;
const leafCount = 2**16;
const branchCount = 2*7;

// TESTS
// ================================================================================================
(function runTest() {

    let t0 = 0, t1 = 0, s1 = 0;

    for (let i = 0; i < iterations; i++) {
        let elements: Buffer[] = [];
        for (let i = 0; i < leafCount; i++) {
            const hexValue = Math.floor(Math.random() * 10000000).toString(16);
            elements.push(Buffer.from(hexValue, 'hex'));
        }
        
        let indexSet = new Set<number>();
        while (indexSet.size < branchCount) {
            indexSet.add(Math.floor(Math.random() * leafCount));
        }
        let indexes = Array.from(indexSet);

        let controlSet = new Set<number>();
        while (controlSet.size < branchCount) {
            controlSet.add(Math.floor(Math.random() * leafCount));
        }
        let controls = Array.from(controlSet);

        let start = Date.now();
        const tree = MerkleTree.create(elements, 'sha256');
        t0 += Date.now() - start;

        start = Date.now();
        const mp = tree.proveBatch(indexes);
        t1 += Date.now() - start;
        for (let i = 0; i < mp.nodes.length; i++) {
            s1 += mp.nodes[i].length;
        }
        s1 += mp.values.length;
        
        assert.equal(MerkleTree.verifyBatch(tree.root, indexes, mp, 'sha256'), true);
        assert.equal(MerkleTree.verifyBatch(tree.root, controls, mp, 'sha256'), false);
    }

    console.log(`tree built in ${Math.round(t0 / iterations)} ms`);
    console.log(`proof size: ${Math.round(s1 / iterations)}, time: ${Math.round(t1 / iterations * 100) / 100} ms`);
})();