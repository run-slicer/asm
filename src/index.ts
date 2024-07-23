import { type ClassEntry, type Pool, read as readPool } from "./pool";
import { Reader } from "./reader";

export interface Node {
    magic: number;
    minor: number;
    major: number;
    pool: Pool;
    access: number;
    thisClass: ClassEntry;
    superClass?: ClassEntry;

    valid(): boolean;
}

export const read = async (reader: Reader): Promise<Node> => {
    const node: Partial<Node> = {
        magic: await reader.integer(),
        minor: await reader.unsignedShort(),
        major: await reader.unsignedShort(),
        pool: await readPool(reader),
        access: await reader.unsignedShort(),
        valid: () => node.magic === 0xcafebabe,
    };

    node.thisClass = node.pool![await reader.unsignedShort()] as ClassEntry;

    const superIndex = await reader.unsignedShort();
    if (superIndex !== 0) {
        node.superClass = node.pool![superIndex] as ClassEntry;
    }

    return node as Node;
};
