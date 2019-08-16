import { WasmArray as IWasmArray } from '@guildofweavers/merkle';

export class WasmArray implements IWasmArray {

    readonly memory     : WebAssembly.Memory;
    readonly base       : number;
    readonly length     : number;
    readonly elementSize: number;

    constructor(memory: WebAssembly.Memory, base: number, length: number, elementSize: number) {
        this.memory = memory;
        this.base = base;
        this.length = length;
        this.elementSize = elementSize;
    }

    get byteLength(): number {
        return this.length * this.elementSize;
    }

    getValue(index: number): Buffer {
        return Buffer.from(this.memory.buffer, this.base + index * this.elementSize, this.elementSize);
    }

    toBuffer(offset = 0, byteLength?: number): Buffer {
        const start = this.base + offset;
        if (byteLength === undefined) {
            byteLength = (this.base + this.byteLength) - start;
        }
        return Buffer.from(this.memory.buffer, start, byteLength);
    }
}