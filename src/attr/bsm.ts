import { create, wrap } from "../buffer";
import type { Entry, HandleEntry, Pool } from "../pool";
import { AttributeType } from "../spec";
import type { Attribute } from "./";

export interface BootstrapMethodArgument {
    index: number;
    entry?: Entry;
}

export interface BootstrapMethod {
    ref: number;
    refEntry?: HandleEntry;

    args: BootstrapMethodArgument[];
}

export interface BootstrapMethodsAttribute extends Attribute {
    type: AttributeType.BOOTSTRAP_METHODS;

    methods: BootstrapMethod[];
}

export const readBootstrapMethods = (attr: Attribute, pool: Pool): BootstrapMethodsAttribute => {
    const buffer = wrap(attr.data);

    const numMethods = buffer.getUint16();
    const methods = new Array<BootstrapMethod>(numMethods);
    for (let x = 0; x < numMethods; x++) {
        const ref = buffer.getUint16();

        const numArgs = buffer.getUint16();
        const args = new Array<BootstrapMethodArgument>(numArgs);
        for (let y = 0; y < numArgs; y++) {
            const index = buffer.getUint16();
            args[y] = { index, entry: pool[index] };
        }

        methods[x] = { ref, refEntry: pool[ref] as HandleEntry | undefined, args };
    }

    return { ...attr, type: AttributeType.BOOTSTRAP_METHODS, methods };
};

export const writeBootstrapMethods = (attr: BootstrapMethodsAttribute): Uint8Array => {
    const buffer = create(2 + attr.methods.reduce((acc, m) => acc + 4 + m.args.length * 2, 0));

    buffer.setUint16(attr.methods.length);
    for (const bsm of attr.methods) {
        if (bsm.refEntry) {
            bsm.ref = bsm.refEntry.index;
        }

        buffer.setUint16(bsm.ref);

        buffer.setUint16(bsm.args.length);
        for (const arg of bsm.args) {
            if (arg.entry) {
                arg.index = arg.entry.index;
            }

            buffer.setUint16(arg.index);
        }
    }

    return buffer.arrayView;
};
