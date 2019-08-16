import { WasmArray } from './WasmArray';
import { randomBytes } from 'crypto';
import { buildMerkleTree, wasm } from '../lib/hash/wasmBlake2s';
import { WasmBlake2s } from './WasmBlake2s';

const wasm2 = new WasmBlake2s();

const elementSize = 32;
const elementCount = 2**20;
const depth = Math.log2(elementCount);

const controls = new Array<Buffer>(elementCount);

//const wasm = instantiateBlake2s();
const bRef = wasm.newArray(elementCount * elementSize);
for (let i = 0; i < elementCount; i++) {
    controls[i] = randomBytes(elementSize);
    wasm.U8.set(controls[i], bRef + i * elementSize);
}

const values = new WasmArray((wasm as any).memory, bRef, elementCount, elementSize);
console.log(values.toBuffer().byteLength);

let v1: Buffer;
console.time('v1');
for (let i = 0; i < 10; i++) {
    v1 = Buffer.from(wasm2.buildMerkleNodes(depth, controls));
}
console.timeEnd('v1');

let v2: Buffer;
console.time('v2');
for (let i = 0; i < 10; i++) {
    v2 = Buffer.from(buildMerkleTree(depth, controls));
}
console.timeEnd('v2');

console.log(v1!.equals(v2!));
console.log(wasm.U8.byteLength / 1024 / 1024);