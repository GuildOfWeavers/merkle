import { Vector } from '@guildofweavers/merkle';

export class WasmVector implements Vector {

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

    toBuffer(startIdx = 0, elementCount?: number): Buffer {
        
        const offset = this.base + startIdx * this.elementSize;
        let length: number;
        if (elementCount === undefined) {
            length = (this.base + this.byteLength) - offset;
        }
        else {
            length = elementCount * this.elementSize;
        }
        return Buffer.from(this.memory.buffer, offset, length);
    }
}