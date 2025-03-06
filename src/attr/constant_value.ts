import { create, wrap } from "../buffer";
import type { Entry, Pool } from "../pool";
import { AttributeType } from "../spec";
import type { Attribute } from "./";

export interface ConstantValueAttribute extends Attribute {
    type: AttributeType.CONSTANT_VALUE;

    constIndex: number;
    constEntry?: Entry;
}

export const readConstantValue = (attr: Attribute, pool: Pool): ConstantValueAttribute => {
    const buffer = wrap(attr.data);

    const constIndex = buffer.getUint16();
    return {
        ...attr,
        type: AttributeType.CONSTANT_VALUE,
        constIndex,
        constEntry: pool[constIndex] as Entry | undefined,
    };
};

export const writeConstantValue = (attr: ConstantValueAttribute): Uint8Array => {
    if (attr.constEntry) {
        attr.constIndex = attr.constEntry.index;
    }

    const buffer = create(2);
    buffer.setUint16(attr.constIndex);

    return buffer.arrayView;
};
