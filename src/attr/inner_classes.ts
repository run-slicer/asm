import { create, wrap } from "../buffer";
import type { ClassEntry, Pool, UTF8Entry } from "../pool";
import { AttributeType } from "../spec";
import type { Attribute } from "./";

export interface InnerClass {
    innerIndex: number;
    innerEntry?: ClassEntry;
    outerIndex: number;
    outerEntry?: ClassEntry;

    innerNameIndex: number;
    innerNameEntry?: UTF8Entry;
    innerAccess: number;
}

export interface InnerClassesAttribute extends Attribute {
    type: AttributeType.INNER_CLASSES;

    classes: InnerClass[];
}

export const readInnerClasses = (attr: Attribute, pool: Pool): InnerClassesAttribute => {
    const buffer = wrap(attr.data);

    const numClasses = buffer.getUint16();
    const classes = new Array<InnerClass>(numClasses);
    for (let i = 0; i < numClasses; i++) {
        const innerIndex = buffer.getUint16();
        const outerIndex = buffer.getUint16();
        const innerNameIndex = buffer.getUint16();

        classes[i] = {
            innerIndex,
            innerEntry: pool[innerIndex] as ClassEntry | undefined,
            outerIndex,
            outerEntry: pool[outerIndex] as ClassEntry | undefined,
            innerNameIndex,
            innerNameEntry: pool[innerNameIndex] as UTF8Entry | undefined,
            innerAccess: buffer.getUint16(),
        };
    }

    return { ...attr, type: AttributeType.INNER_CLASSES, classes };
};

export const writeInnerClasses = (attr: InnerClassesAttribute): Uint8Array => {
    const buffer = create(2 + 8 * attr.classes.length);

    buffer.setUint16(attr.classes.length);
    for (const inner of attr.classes) {
        if (inner.innerEntry) {
            inner.innerIndex = inner.innerEntry.index;
        }
        buffer.setUint16(inner.innerIndex);

        if (inner.outerEntry) {
            inner.outerIndex = inner.outerEntry.index;
        }
        buffer.setUint16(inner.outerIndex);

        if (inner.innerNameEntry) {
            inner.innerNameIndex = inner.innerNameEntry.index;
        }
        buffer.setUint16(inner.innerNameIndex);

        buffer.setUint16(inner.innerAccess);
    }

    return buffer.arrayView;
};
