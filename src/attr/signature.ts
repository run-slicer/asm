import type { Pool, UTF8Entry } from "../pool";
import { create, wrap } from "../buffer";
import type { Attribute } from "./";

export interface SignatureAttribute extends Attribute {
    signatureIndex: number; // UTF8Entry index

    signatureEntry?: UTF8Entry;
}

export const readSignature = (attr: Attribute, pool: Pool): SignatureAttribute => {
    const buffer = wrap(attr.data);

    const signatureIndex = buffer.getUint16();
    return {
        ...attr,
        signatureIndex,
        signatureEntry: pool[signatureIndex] as UTF8Entry | undefined,
    };
};

export const writeSignature = (attr: SignatureAttribute): Uint8Array => {
    if (attr.signatureEntry) {
        attr.signatureIndex = attr.signatureEntry.index;
    }

    const buffer = create(2);
    buffer.setUint16(attr.signatureIndex);

    return buffer.arrayView;
};
