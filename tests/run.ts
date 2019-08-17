// IMPORTS
// ================================================================================================
import * as assert from 'assert';
import * as crypto from 'crypto';
import { MerkleTree } from '../lib/MerkleTree';
import { HashAlgorithm } from '@guildofweavers/merkle';

// MODULE VARIABLES
// ================================================================================================
const iterations = 10;
const leafCount = 2**18;
const branchCount = 2*7;
const algorithm : HashAlgorithm = 'blake2s256';

// TESTS
// ================================================================================================
(function runTest() {

    let t0 = 0, t1 = 0, s1 = 0;

    for (let i = 0; i < iterations; i++) {
        let elements: Buffer[] = [];
        for (let i = 0; i < leafCount; i++) {
            elements.push(crypto.randomBytes(32));
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
        const tree = MerkleTree.create(elements, algorithm);
        t0 += Date.now() - start;

        start = Date.now();
        const mp = tree.proveBatch(indexes);
        t1 += Date.now() - start;
        for (let i = 0; i < mp.nodes.length; i++) {
            s1 += mp.nodes[i].length;
        }
        s1 += mp.values.length;
        
        assert.equal(MerkleTree.verifyBatch(tree.root, indexes, mp, algorithm), true);
        assert.equal(MerkleTree.verifyBatch(tree.root, controls, mp, algorithm), false);
    }

    console.log(`tree built in ${Math.round(t0 / iterations)} ms`);
    console.log(`proof size: ${Math.round(s1 / iterations)}, time: ${Math.round(t1 / iterations * 100) / 100} ms`);
})();