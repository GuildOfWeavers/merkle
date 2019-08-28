"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class JsVector {
    constructor(values) {
        this.values = values;
        this.elementSize = values[0].byteLength;
    }
    static fromBuffer(values, valueSize) {
        const elementCount = values.byteLength / valueSize;
        if (!Number.isInteger(elementCount)) {
            throw new Error('Value buffer cannot contain partial number of elements');
        }
        const result = new Array(elementCount);
        for (let i = 0, offset = 0; i < elementCount; i++, offset += valueSize) {
            result[i] = values.slice(offset, offset + valueSize);
        }
        return new JsVector(result);
    }
    get byteLength() {
        return this.values.length * this.elementSize;
    }
    get length() {
        return this.values.length;
    }
    copyValue(index, destination, offset) {
        const value = this.values[index];
        value.copy(destination, offset);
        return this.elementSize;
    }
    toBuffer(startIdx = 0, elementCount) {
        if (elementCount === undefined) {
            elementCount = this.values.length - startIdx;
        }
        if (elementCount === 1) {
            return this.values[startIdx];
        }
        const result = Buffer.alloc(elementCount * this.elementSize);
        const endIdx = startIdx + elementCount;
        let offset = 0;
        for (let i = startIdx; i < endIdx; i++, offset += this.elementSize) {
            this.values[i].copy(result, offset);
        }
        return result;
    }
}
exports.JsVector = JsVector;
//# sourceMappingURL=JsVector.js.map