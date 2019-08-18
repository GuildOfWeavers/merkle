// IMPORTS
// ================================================================================================
import * as assert from 'assert';
import * as crypto from 'crypto';
import { Vector } from '@guildofweavers/merkle';
import { MerkleTree, createHash } from '../index';
import { JsVector } from '../lib/JsVector';
import { WasmVector } from './WasmVector';
import { instantiateBlake2s } from '../lib/assembly';

// MODULE VARIABLES
// ================================================================================================
const iterations = 10;
const leafCount = 2**18;
const branchCount = 2*7;
const elementSize = 32;

const memory = new WebAssembly.Memory({ initial: 10 });
const wasm = instantiateBlake2s(memory);

const dataInWasm = true;
const hash = createHash("blake2s256", { memory });

// TESTS
// ================================================================================================
(function runTest() {

    let t0 = 0, t1 = 0, s1 = 0;

    for (let i = 0; i < iterations; i++) {
        let leaves = generateLeaves();
        
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
        const tree = MerkleTree.create(leaves, hash);
        t0 += Date.now() - start;

        start = Date.now();
        const mp = tree.proveBatch(indexes);
        t1 += Date.now() - start;
        for (let i = 0; i < mp.nodes.length; i++) {
            s1 += mp.nodes[i].length;
        }
        s1 += mp.values.length;
        
        assert.equal(MerkleTree.verifyBatch(tree.root, indexes, mp, hash), true);
        assert.equal(MerkleTree.verifyBatch(tree.root, controls, mp, hash), false);

        if (leaves instanceof WasmVector) {
            wasm.__release(leaves.base);
        }
    }

    console.log(`tree built in ${Math.round(t0 / iterations)} ms`);
    console.log(`proof size: ${Math.round(s1 / iterations)}, time: ${Math.round(t1 / iterations * 100) / 100} ms`);
})();

function generateLeaves(): Vector {
    let elements: Buffer[] = [], bRef: number;
    if (dataInWasm) {
        bRef = wasm.newArray(leafCount * elementSize);
    }

    for (let i = 0; i < leafCount; i++) {
        let value = crypto.randomBytes(elementSize);
        if (dataInWasm) {
            wasm.U8.set(value, bRef! + i * elementSize);
        }
        else {
            elements.push(value);
        }
    }

    if (dataInWasm) {
        return new WasmVector(memory, bRef!, leafCount, elementSize)
    }
    else {
        return new JsVector(elements);
    }
}