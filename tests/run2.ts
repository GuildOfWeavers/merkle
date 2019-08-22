// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';
import { Worker } from 'worker_threads';
import { Vector } from '@guildofweavers/merkle';
import { JsVector } from '../lib/vectors/JsVector';
import { createHash } from '../lib/hash';

// MODULE VARIABLES
// ================================================================================================
const buffer = Buffer.from(new SharedArrayBuffer(256 * 2**20)); // 256 MB
const workerData = { algorithm: 'blake2s256', buffer: buffer.buffer };
const elementSize = 16;
const elementCount = 2**22;

const hash = createHash('blake2s256');

// SET UP WORKERS
// ================================================================================================
console.time('new workers');
const workers = new Array<Worker>(2);
for (let i = 0; i < workers.length; i++) {
    workers[i] = new Worker(__dirname + '/worker.js', { workerData });
    workers[i].on('message', (message) => {
        console.log(`Message from worker: ${message}`);
        doneCount++;
        if (doneCount === workers.length) {
            resolver(buffer.slice(resultRef, resultRef + resultLength));;
        }
    });
}
console.timeEnd('new workers');

let doneCount = 0;
let resultRef = 0;
let resultLength = 0;
let resolver: (result: Buffer) => void;

function hashAsync(vector: Vector): Promise<Buffer> {

    doneCount = 0;
    resultRef = vector.byteLength;
    resultLength = vector.length * 32;

    const vElementSize = vector.elementSize;
    const vElementCount = vector.length / workers.length;
    const vSliceLength = vector.byteLength / workers.length;
    const resSliceLength = resultLength / workers.length;

    const vBuffer = vector.toBuffer();

    for (let i = 0; i < workers.length; i++) {
        // copy data into the shared buffer
        const vRef = i * vSliceLength;
        buffer.set(vBuffer.slice(vRef, vRef + vSliceLength), vRef);
        const resRef = resultRef + i * resSliceLength;

        // dispatch hashing to workers
        workers[i].postMessage({ vRef, resRef, vElementSize, vElementCount });
    }

    return new Promise((resolve, reject) => {
        resolver = resolve;
    });
}

// TESTING
// ================================================================================================
const v1 = generateVector(elementCount);

(async function test() {

    console.time('async hash');
    const r1 = await hashAsync(v1);
    console.timeEnd('async hash');

    let r2 = '';
    for (let i = 0; i < elementCount; i++) {
        r2 += hash.digest(v1.toBuffer(i, 1)).toString('hex');
    }
    console.log(r1.toString('hex') === r2);

})().then(() => {
    console.log('done!');
});

// HELPER FUNCTIONS
// ================================================================================================
function generateVector(elementCount: number): Vector {
    let elements: Buffer[] = [], bRef: number;
    
    for (let i = 0; i < elementCount; i++) {
        let value = crypto.randomBytes(elementSize);
        elements.push(value);
    }

    return new JsVector(elements);
}