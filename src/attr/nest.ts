import { create, wrap } from "../buffer";
import type { ClassEntry, Pool } from "../pool";
import { AttributeType } from "../spec";
import type { Attribute } from "./";

export interface NestHostAttribute extends Attribute {
    type: AttributeType.NEST_HOST;

    hostClass: number;
    hostClassEntry?: ClassEntry;
}

export const readNestHost = (attr: Attribute, pool: Pool): NestHostAttribute => {
    const buffer = wrap(attr.data);

    const hostClass = buffer.getUint16();
    return {
        ...attr,
        type: AttributeType.NEST_HOST,
        hostClass,
        hostClassEntry: pool[hostClass] as ClassEntry | undefined,
    };
};

export const writeNestHost = (attr: NestHostAttribute): Uint8Array => {
    const buffer = create(2);
    if (attr.hostClassEntry) {
        attr.hostClass = attr.hostClassEntry.index;
    }
    buffer.setUint16(attr.hostClass);

    return buffer.arrayView;
};

export interface NestMember {
    index: number;
    entry?: ClassEntry;
}

export interface NestMembersAttribute extends Attribute {
    type: AttributeType.NEST_MEMBERS;

    classes: NestMember[];
}

export const readNestMembers = (attr: Attribute, pool: Pool): NestMembersAttribute => {
    const buffer = wrap(attr.data);

    const numClasses = buffer.getUint16();
    const classes = new Array<NestMember>(numClasses);
    for (let i = 0; i < numClasses; i++) {
        const index = buffer.getUint16();

        classes[i] = { index, entry: pool[index] as ClassEntry | undefined };
    }

    return { ...attr, type: AttributeType.NEST_MEMBERS, classes };
};

export const writeNestMembers = (attr: NestMembersAttribute): Uint8Array => {
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
