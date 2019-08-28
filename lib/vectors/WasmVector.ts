// IMPORTS
// ================================================================================================
import { Vector, WasmModule } from '@guildofweavers/merkle';

// CLASS DEFINITION
// ================================================================================================
export class WasmVector implements Vector {

    readonly wasm       : WasmModule;
    readonly base       : number;
    readonly length     : number;
    readonly elementSize: number;

    constructor(wasm: WasmModule, base: number, length: number, elementSize: number) {
        this.wasm = wasm;
        this.base = base;
        this.length = length;
        this.elementSize = elementSize;
    }

    static fromBuffer(wasm: WasmModule, values: Buffer, valueSize: number): WasmVector {
        const elementCount = values.byteLength / valueSize;
        if (!Number.isInteger(elementCount)) {
            throw new Error('Value buffer cannot contain partial number of elements');
        }

        if (wasm.memory.buffer === values.buffer) {
            return new WasmVector(wasm, values.byteOffset, elementCount, valueSize);
        }
        else {
            const base = wasm.newArray(values.byteLength);
            wasm.U8.set(values, base);
            return new WasmVector(wasm, base, elementCount, valueSize);
        }
    }

    get byteLength(): number {
        return this.length * this.elementSize;
    }

    copyValue(index: number, destination: Buffer, offset: number): number {
        const value = Buffer.from(this.wasm.memory.buffer, this.base + index * this.elementSize, this.elementSize);
        value.copy(destination, offset);
        return this.elementSize;
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
        return Buffer.from(this.wasm.memory.buffer, offset, length);
    }
}