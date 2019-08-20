"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class WasmVector {
    constructor(memory, base, length, elementSize) {
        this.memory = memory;
        this.base = base;
        this.length = length;
        this.elementSize = elementSize;
    }
    get byteLength() {
        return this.length * this.elementSize;
    }
    copyValue(index, destination, offset) {
        const value = Buffer.from(this.memory.buffer, this.base + index * this.elementSize, this.elementSize);
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
        return Buffer.from(this.memory.buffer, offset, length);
    }
}
exports.WasmVector = WasmVector;
//# sourceMappingURL=WasmVector.js.map