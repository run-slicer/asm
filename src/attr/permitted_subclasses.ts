import { create, wrap } from "../buffer";
import type { ClassEntry, Pool } from "../pool";
import { AttributeType } from "../spec";
import type { Attribute } from "./";

export interface PermittedSubclass {
    index: number;
    entry?: ClassEntry;
}

export interface PermittedSubclassesAttribute extends Attribute {
    type: AttributeType.PERMITTED_SUBCLASSES;

    classes: PermittedSubclass[];
}

export const readPermittedSubclasses = (attr: Attribute, pool: Pool): PermittedSubclassesAttribute => {
    const buffer = wrap(attr.data);

    const numClasses = buffer.getUint16();
    const classes = new Array<PermittedSubclass>(numClasses);
    for (let i = 0; i < numClasses; i++) {
        const index = buffer.getUint16();

        classes[i] = { index, entry: pool[index] as ClassEntry | undefined };
    }

    return { ...attr, type: AttributeType.PERMITTED_SUBCLASSES, classes };
};

export const writePermittedSubclasses = (attr: PermittedSubclassesAttribute): Uint8Array => {
    const buffer = create(2 * (1 + attr.classes.length));

    buffer.setUint16(attr.classes.length);
    for (const pClass of attr.classes) {
        if (pClass.entry) {
            pClass.index = pClass.entry.index;
        }

        buffer.setUint16(pClass.index);
    }

    return buffer.arrayView;
};
