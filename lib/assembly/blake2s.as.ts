// <reference no-default-lib="true"/>
/// <reference path="../../node_modules/assemblyscript/std/assembly/index.d.ts" />

// CONSTANTS
// ================================================================================================
const SIGMA = new ArrayBuffer(160);
const IV = new ArrayBuffer(32);

export function getSigmaRef(): usize {
    return changetype<usize>(SIGMA);
}

export function getIvRef(): usize {
    return changetype<usize>(IV);
}

// MODULE VARIABLES
// ================================================================================================
let v = new ArrayBuffer(64);
let m = new ArrayBuffer(64);
let t: u64 = 0;

// INPUTS / OUTPUTS
// ================================================================================================
let _output = new ArrayBuffer(32);
let _inputs = new ArrayBuffer(1024);

export function getInputsRef(): usize {
    return changetype<usize>(_inputs);
}

export function getOutputRef(): usize {
    return changetype<usize>(_output);
}

export function newArray(length: i32): ArrayBuffer {
    return new ArrayBuffer(length);
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function hash(vRef: usize, vLength: i32, resRef: usize): void {

    // initialize the context
    store<u32>(resRef, 0x6b08e647);   // h[0] = IV[0] ^ 0x01010000 ^ 0 ^ 32;
    memory.copy(resRef + 4, changetype<usize>(IV) + 4, 28);
    t = 0;

    // run intermediate compressions
    let mRef = changetype<usize>(m);
    while (vLength > 64) {
        memory.copy(mRef, vRef + <u32>t, 64);
        t += 64;
        compress(resRef, false);
        vLength -= 64;
    }

    // run final compression
    if (vLength > 0) {
        memory.copy(mRef, vRef + <u32>t, vLength);
    }
    memory.fill(mRef + vLength, 0, 64 - vLength);
    t += vLength;
    compress(resRef, true);
}

export function hashValues1(vRef: usize, resRef: usize, vElementSize: i32, vElementCount: i32): usize {
    for (let i = 0; i < vElementCount; i++) {
        hash(vRef, vElementSize, resRef);
        vRef += vElementSize;
        resRef += 32;
    }
    return resRef;
}

export function hashValues2(vRef: usize, resRef: usize, vElementSize: i32, vElementCount: i32): usize {
    for (let i = vElementCount - 1; i > 0; i--) {
        hash(vRef, vElementSize, resRef);
        vRef -= vElementSize;
        resRef -= 32;
    }
    return resRef;
}

export function mergeArrayElements(vRefs: usize, resRef: usize, vCount: i32, vElementCount: i32, vElementSize: i32): void {

    let mRef = changetype<usize>(m);
    let vLength = vCount * vElementSize;
    let vOffset = 0;
    let resEnd = resRef + vElementCount * 32;

    while (resRef < resEnd) {

        // initialize the context
        store<u32>(resRef, 0x6b08e647);   // h[0] = IV[0] ^ 0x01010000 ^ 0 ^ 32;
        memory.copy(resRef + 4, changetype<usize>(IV) + 4, 28);
        t = 0;
        let c = 0;
        
        // run intermediate compressions
        for (let j = 0; j < vCount; j++) {
            let vRef = <usize>load<u64>(vRefs + (j << 3));
            memory.copy(mRef + c, vRef + vOffset, vElementSize);
            c += vElementSize;
            t += vElementSize;
            
            if (c == 64 && t != vLength) {
                c = 0;
                compress(resRef, false);
            }
        }
        
        // run final compression
        memory.fill(mRef + c, 0, 64 - c);
        compress(resRef, true);

        // update references for the next loop iteration
        resRef += 32;
        vOffset += vElementSize;
    }
}

// INTERNAL FUNCTIONS
// ================================================================================================
function compress(hRef: usize, last: boolean): void {
    
    let vRef = changetype<usize>(v);
    let iRef = changetype<usize>(IV);

    memory.copy(vRef, hRef, 32);                // v[0-31] = h[0-31]
    memory.copy(vRef + 32, iRef, 32);           // v[32-63] = IV[0-31]

    let v12 = load<u32>(vRef, 12 * 4);          // v[12] = v[12] ^ t
    store<u32>(vRef, v12 ^ t, 12 * 4);

    let v13 = load<u32>(vRef, 13 * 4);          // v[13] = v[13] ^ (t >> 32)
    store<u32>(vRef, v13 ^ (t >> 32), 13 * 4);

    if (last) {
        let v14 = load<u32>(vRef, 14 * 4);
        store<u32>(vRef, ~v14, 14 * 4);
    }

    let sRef = changetype<usize>(SIGMA), sRefEnd = sRef + 160, si: u64;
    while (sRef < sRefEnd) {
        si = load<u64>(sRef, 0);
        mix( 0, 16, 32, 48, <u8>(si),       <u8>(si >>  8));
        mix( 4, 20, 36, 52, <u8>(si >> 16), <u8>(si >> 24));
        mix( 8, 24, 40, 56, <u8>(si >> 32), <u8>(si >> 40));
        mix(12, 28, 44, 60, <u8>(si >> 48), <u8>(si >> 56));

        si = load<u64>(sRef, 8);
        mix( 0, 20, 40, 60, <u8>(si),       <u8>(si >>  8));
        mix( 4, 24, 44, 48, <u8>(si >> 16), <u8>(si >> 24));
        mix( 8, 28, 32, 52, <u8>(si >> 32), <u8>(si >> 40));
        mix(12, 16, 36, 56, <u8>(si >> 48), <u8>(si >> 56));

        sRef += 16;
    }

    let v1: u32, v2: u32, hv: u32;
    for (let i = 0; i < 8; i++, vRef += 4, hRef += 4) {
        v1 = load<u32>(vRef);
        v2 = load<u32>(vRef, 32);
        hv = load<u32>(hRef);
        store<u32>(hRef, hv ^ v1 ^ v2);
    }
}

// @ts-ignore
@inline
function mix(a: u8, b: u8, c: u8, d: u8, xi: u8, yi: u8): void {

    let mRef = changetype<usize>(m);
    let x = load<u32>(mRef + xi);
    let y = load<u32>(mRef + yi);

    let vRef = changetype<usize>(v);
    let vaRef = vRef + a;
    let vbRef = vRef + b;
    let vcRef = vRef + c;
    let vdRef = vRef + d;
    
    let va = load<u32>(vaRef);          // v[a] = v[a] + v[b] + x
    let vb = load<u32>(vbRef);
    va = va + vb + x;
    let vd = load<u32>(vdRef);          // v[d] = rotr(v[d] ^ v[a], 16)
    vd = rotr(vd ^ va, 16);
    let vc = load<u32>(vcRef);          // v[c] = v[c] + v[d]
    vc = vc + vd;
    vb = rotr(vb ^ vc, 12);             // v[b] = rotr(v[b] ^ v[c], 12)
    va = va + vb + y;                   // v[a] = v[a] + v[b] + y
    vd = rotr(vd ^ va, 8);              // v[d] = rotr(v[d] ^ v[a], 8)
    vc = vc + vd;                       // v[c] = v[c] + v[d]
    vb = rotr(vb ^ vc, 7);              // v[b] = rotr(v[b] ^ v[c], 7)

    store<u32>(vaRef, va);
    store<u32>(vbRef, vb);
    store<u32>(vcRef, vc);
    store<u32>(vdRef, vd);
}