"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class WasmVector {
    constructor(wasm, base, length, elementSize) {
        this.wasm = wasm;
        this.base = base;
        this.length = length;
        this.elementSize = elementSize;
    }
    static fromBuffer(wasm, values, valueSize) {
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
    get byteLength() {
        return this.length * this.elementSize;
    }
    copyValue(index, destination, offset) {
        const value = Buffer.from(this.wasm.memory.buffer, this.base + index * this.elementSize, this.elementSize);
        value.copy(destination, offset);
        return this.elementSize;
    }
    toBuffer(startIdx = 0, elementCount) {
        const offset = this.base + startIdx * this.elementSize;
        let length;
        if (elementCount === undefined) {
            length = (this.base + this.byteLength) - offset;
        }
        else {
            length = elementCount * this.elementSize;
        }
        return Buffer.from(this.wasm.memory.buffer, offset, length);
    }
}
exports.WasmVector = WasmVector;
//# sourceMappingURL=WasmVector.js.map