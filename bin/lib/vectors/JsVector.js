"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class JsVector {
    constructor(values) {
        this.values = values;
        this.elementSize = values[0].byteLength;
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