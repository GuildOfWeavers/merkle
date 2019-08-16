import { WasmBlake2s } from '../lib/assembly';
import { parentPort, workerData } from 'worker_threads';

interface WorkerConfig {
    value: Buffer;
}

const data = workerData;
console.log(data);
const wasm: WasmBlake2s = data.wasm;
const i1Ref = wasm.getInput1Ref();
const oRef = wasm.getOutputRef();

parentPort!.on('message', ({ value }: WorkerConfig) => {
    wasm.U8.set(value, i1Ref);
    wasm.hash1(i1Ref, oRef);
    parentPort!.postMessage('done!');
});

/*
parentPort!.on('message', (message: {a: number[]; b: number[] }) => {
    const c = new Array<number>(message.a.length);
    for (let i = 0; i < c.length; i++) {
        c[i] = message.a[i] + message.b[i];
    }

    parentPort!.postMessage(c);
});
*/