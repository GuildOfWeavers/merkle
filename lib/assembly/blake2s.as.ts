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

// INPUTS / OUTPUTS
// ================================================================================================
let _input1 = new ArrayBuffer(32);
let _input2 = new ArrayBuffer(32);
let _output = new ArrayBuffer(32);

export function getInput1Ref(): usize {
    return changetype<usize>(_input1);
}

export function getInput2Ref(): usize {
    return changetype<usize>(_input2);
}

export function getOutputRef(): usize {
    return changetype<usize>(_output);
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function hash1(vRef: usize, resRef: usize): void {

    // initialize the context
    store<u32>(resRef, 0x6b08e647);   // h[0] = IV[0] ^ 0x01010000 ^ 0 ^ 32;
    memory.copy(resRef + 4, changetype<usize>(IV) + 4, 28);
    c = 32;
    t = 32;

    // copy input into the buffer
    let bRef = changetype<usize>(b);
    memory.copy(bRef, vRef, 32);
    memory.fill(bRef + 32, 0, 32);
    
    // run compression function and store result under resRef
    compress(resRef, true);
}

export function hash2(xRef: usize, yRef: usize, resRef: usize): void {

    // initialize the context
    store<u32>(resRef, 0x6b08e647);   // h[0] = IV[0] ^ 0x01010000 ^ 0 ^ 32;
    memory.copy(resRef + 4, changetype<usize>(IV) + 4, 28);
    c = 64;
    t = 64;

    // copy input into the buffer
    let bRef = changetype<usize>(b);
    memory.copy(bRef, xRef, 32);
    memory.copy(bRef + 32, yRef, 32);
    
    // run compression function and store result under resRef
    compress(resRef, true);
}

// MODULE VARIABLES
// ================================================================================================
let v = new ArrayBuffer(64);
let b = new ArrayBuffer(64);
let c: u64 = 0;
let t: u64 = 0;

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

    let bRef = changetype<usize>(b);
    let sRef = changetype<usize>(SIGMA);
    let s1: u8, s2: u8, m1: u32, m2: u32;
    for (let i = 0; i < 160; i += 16) {
        // mix 1
        s1 = load<u8>(sRef + i, 0);
        s2 = load<u8>(sRef + i, 1);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(0, 4,  8, 12, m1, m2);

        // mix 2
        s1 = load<u8>(sRef + i, 2);
        s2 = load<u8>(sRef + i, 3);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(1, 5,  9, 13, m1, m2);

        // mix 3
        s1 = load<u8>(sRef + i, 4);
        s2 = load<u8>(sRef + i, 5);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(2, 6, 10, 14, m1, m2);

        // mix 4
        s1 = load<u8>(sRef + i, 6);
        s2 = load<u8>(sRef + i, 7);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(3, 7, 11, 15, m1, m2);

        // mix 5
        s1 = load<u8>(sRef + i, 8);
        s2 = load<u8>(sRef + i, 9);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(0, 5, 10, 15, m1, m2);

        // mix 6
        s1 = load<u8>(sRef + i, 10);
        s2 = load<u8>(sRef + i, 11);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(1, 6, 11, 12, m1, m2);

        // mix 7
        s1 = load<u8>(sRef + i, 12);
        s2 = load<u8>(sRef + i, 13);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(2, 7,  8, 13, m1, m2);

        // mix 8
        s1 = load<u8>(sRef + i, 14);
        s2 = load<u8>(sRef + i, 15);
        m1 = load<u32>(bRef + (s1 << 2));
        m2 = load<u32>(bRef + (s2 << 2));
        mix(3, 4,  9, 14, m1, m2);
    }

    let v1: u32, v2: u32, hv: u32;
    for (let i = 0; i < 8; i++, vRef += 4, hRef += 4) {
        v1 = load<u32>(vRef);
        v2 = load<u32>(vRef, 32);
        hv = load<u32>(hRef);
        store<u32>(hRef, hv ^ v1 ^ v2);
    }
}

function mix(a: u8, b: u8, c: u8, d: u8, x: u32, y: u32): void {

    let vRef = changetype<usize>(v);
    let vaRef = vRef + (a << 2);
    let vbRef = vRef + (b << 2);
    let vcRef = vRef + (c << 2);
    let vdRef = vRef + (d << 2);
    
    let va = load<u32>(vaRef);          // v[a] = v[a] + v[b] + x
    let vb = load<u32>(vbRef);
    va = va + vb + x;
    
    let vd = load<u32>(vdRef);          // v[d] = ROTR32(v[d] ^ v[a], 16)
    vd = vd ^ va;
    vd = (vd >> 16) ^ (vd << 16);

    let vc = load<u32>(vcRef);          // v[c] = v[c] + v[d]
    vc = vc + vd;

    vb = vb ^ vc;                       // v[b] = ROTR32(v[b] ^ v[c], 12)
    vb = (vb >> 12) ^ (vb << 20);

    va = va + vb + y;                   // v[a] = v[a] + v[b] + y

    vd = vd ^ va;                       // v[d] = ROTR32(v[d] ^ v[a], 8)
    vd = (vd >> 8) ^ (vd << 24);

    vc = vc + vd;                       // v[c] = v[c] + v[d]

    vb = vb ^ vc;                       // v[b] = ROTR32(v[b] ^ v[c], 7)
    vb = (vb >> 7) ^ (vb << 25);

    store<u32>(vaRef, va);
    store<u32>(vbRef, vb);
    store<u32>(vcRef, vc);
    store<u32>(vdRef, vd);
}