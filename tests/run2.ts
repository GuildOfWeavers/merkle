import { randomBytes } from 'crypto';
import { Worker } from 'worker_threads';
import { instantiateBlake2s } from '../lib/assembly';

const wasm = instantiateBlake2s();
const oRef = wasm.getOutputRef();
const oEnd = oRef + 32;

console.time('new workers');
const workers = new Array<Worker>(1);
for (let i = 0; i < workers.length; i++) {
    workers[i] = new Worker(__dirname + '/worker.js', { workerData: new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true } as any)});
    workers[i].on('message', (message) => {
        console.log(`Message from worker: ${message}`);
        const result = Buffer.from(wasm.U8.slice(oRef, oEnd))
        resolver(result);
    });
}
console.timeEnd('new workers');

let doneCount = 0;
let resolver: (result: Buffer) => void;

function hashAsync(value: Buffer): Promise<Buffer> {

    workers[0].postMessage({ value });

    return new Promise((resolve, reject) => {
        resolver = resolve;
    });
}

const test = randomBytes(32);
hashAsync(test).then((result) => {
    console.log(`Input: ${test.toString('hex')}`);
    console.log(`Output: ${result.toString('hex')}`);
})