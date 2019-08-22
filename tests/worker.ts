// IMPORTS
// ================================================================================================
import { instantiateBlake2s } from '../lib/assembly';
import { parentPort, workerData } from 'worker_threads';
import { HashAlgorithm } from '@guildofweavers/merkle';

// INTERFACES
// ================================================================================================
interface WorkerConfig {
    algorith    : HashAlgorithm;
    buffer      : SharedArrayBuffer;
}

interface HashRequest {
    vRef            : number;
    resRef          : number;
    vElementSize    : number;
    vElementCount   : number;
}

// MODULE VARIABLES
// ================================================================================================
const config = workerData as WorkerConfig;
const buffer = Buffer.from(config.buffer);
const wasm = instantiateBlake2s();

parentPort!.on('message', (request: HashRequest) => {
    const vLength = request.vElementCount * request.vElementSize;
    const resLength = request.vElementCount * 32;
    
    // copy data into WASM memory
    const vRef = wasm.newArray(vLength);
    wasm.U8.set(buffer.slice(request.vRef, request.vRef + vLength), vRef);

    // hash the data
    const resRef = wasm.newArray(resLength);
    wasm.hashValues1(vRef, resRef, request.vElementSize, request.vElementCount);

    // copy data out of WASM memory
    const resBuf = Buffer.from(wasm.U8.buffer, resRef, resLength);
    buffer.set(resBuf, request.resRef);

    // free WASM memory
    wasm.__release(vRef);
    wasm.__release(resRef);

    parentPort!.postMessage('done!');
});