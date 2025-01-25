import { type DirtyMarkable, FLAG_SKIP_ATTR } from "../";
import type { Buffer } from "../buffer";
import type { Pool, UTF8Entry } from "../pool";
import { AttributeType } from "../spec";
import { type CodeAttribute, type ExceptionTableEntry, readCode, writeCode } from "./code";
import { type SignatureAttribute, readSignature, writeSignature } from "./signature";
import { type SourceFileAttribute, readSourceFile, writeSourceFile } from "./source_file";

export interface Attribute extends DirtyMarkable {
    type?: AttributeType;
    nameIndex: number;
    data: Uint8Array;

    name?: UTF8Entry; // not present if index is invalid
}

export interface Attributable {
    attrs: Attribute[];
}

const readSingle = (buffer: Buffer, pool: Pool, flags: number): Attribute => {
    const nameIndex = buffer.getUint16();
    const name = pool[nameIndex] as UTF8Entry | undefined;

    const data = buffer.get(buffer.getInt32(), true);

    let attr: Attribute = {
        dirty: false,
        nameIndex,
        data,
        name,
    };
    if ((flags & FLAG_SKIP_ATTR) === 0) {
        try {
            switch (name?.string) {
                case AttributeType.CODE: {
                    attr = readCode(attr, pool, flags);
                    break;
                }
                case AttributeType.SOURCE_FILE: {
                    attr = readSourceFile(attr, pool);
                    break;
                }
                case AttributeType.SIGNATURE: {
                    attr = readSignature(attr, pool);
                    break;
                }
            }
        } catch (e) {
            console.warn(`failed to parse ${name?.string || "unknown"} attribute, data length ${data.length}`);
            console.error(e);
        }
    }

    return attr;
};

export const readAttrs = (buffer: Buffer, pool: Pool, flags: number = 0): Attribute[] => {
    const attributesCount = buffer.getUint16();

    const attributes = new Array<Attribute>(attributesCount);
    for (let i = 0; i < attributesCount; i++) {
        attributes[i] = readSingle(buffer, pool, flags);
    }

    return attributes;
};

const writeSingle = (buffer: Buffer, attr: Attribute) => {
    if (attr.dirty) {
        // rebuild data if dirty
        switch (attr.type) {
            case AttributeType.CODE: {
                attr.data = writeCode(attr as CodeAttribute);
                break;
            }
            case AttributeType.SOURCE_FILE: {
                attr.data = writeSourceFile(attr as SourceFileAttribute);
                break;
            }
            case AttributeType.SIGNATURE: {
                attr.data = writeSignature(attr as SignatureAttribute);
                break;
            }
        }

        attr.dirty = false;
    }

    buffer.setUint16(attr.nameIndex);
    buffer.setInt32(attr.data.length);
    buffer.set(attr.data);
};

export const writeAttrs = (buffer: Buffer, attrs: Attribute[]) => {
    buffer.setUint16(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};

export { CodeAttribute, ExceptionTableEntry, SignatureAttribute, SourceFileAttribute };
