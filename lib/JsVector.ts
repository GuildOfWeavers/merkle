// IMPORTS
// ================================================================================================
import { Vector } from "@guildofweavers/merkle";

// CLASS DEFINITION
// ================================================================================================
export class JsVector implements Vector {

    readonly values         : Buffer[];
    readonly elementSize    : number;

    constructor(values: Buffer[]) {
        this.values = values;
        this.elementSize = values[0].byteLength;
    }

    get byteLength(): number {
        return this.values.length * this.elementSize;
    }

    get length(): number {
        return this.values.length;
    }

    toBuffer(startIdx = 0, elementCount?: number): Buffer {
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