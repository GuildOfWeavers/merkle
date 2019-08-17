import { WasmArray } from './WasmArray';
import { randomBytes } from 'crypto';
import { buildMerkleTree, hash } from '../lib/hash/blake2s';
import { JsHash } from '../lib/hash/JsHash';
import { WasmBlake2s } from './WasmBlake2s';

const memory = new WebAssembly.Memory({ initial: 2000 });

const wasmBlake2s = new WasmBlake2s(memory);
const jsHash = new JsHash('blake2s256');

const elementSize = 32;
const elementCount = 2**20;
const depth = Math.ceil(Math.log2(elementCount));

const controls = new Array<Buffer>(elementCount);

//const wasm = instantiateBlake2s();
const bRef = wasmBlake2s.wasm.newArray(elementCount * elementSize);
for (let i = 0; i < elementCount; i++) {
    controls[i] = randomBytes(elementSize);
    wasmBlake2s.wasm.U8.set(controls[i], bRef + i * elementSize);
}

const h1 = wasmBlake2s.digest(controls[0]);
const h2 = jsHash.digest(controls[0]);
const h3 = hash(controls[0]);

const m1 = wasmBlake2s.merge(controls[0], controls[1]);
const m2 = jsHash.merge(controls[0], controls[1]);
const m3 = hash(controls[0], controls[1]);

const values = new WasmArray(memory, bRef, elementCount, elementSize);
console.log(values.toBuffer().byteLength);

let v1: Buffer;
console.time('v1');
for (let i = 0; i < 10; i++) {
    v1 = Buffer.from(wasmBlake2s.buildMerkleNodes(depth, values));
}
console.timeEnd('v1');

let v2: Buffer;
console.time('v2');
for (let i = 0; i < 10; i++) {
    v2 = Buffer.from(buildMerkleTree(depth, controls));
}
console.timeEnd('v2');

let v3: Buffer;
console.time('v3');
for (let i = 0; i < 10; i++) {
    v3 = Buffer.from(jsHash.buildMerkleNodes(depth, values));
}
console.timeEnd('v3');

console.log(v1!.equals(v2!));
console.log(v1!.equals(v3!));
console.log(wasmBlake2s.wasm.U8.byteLength / 1024 / 1024);