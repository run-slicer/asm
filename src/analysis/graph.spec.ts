import { type Dirent, opendirSync, readFileSync } from "node:fs";
import { read } from "../index";
import { join } from "node:path";
import { AttributeType, Opcode } from "../spec";
import type { CodeAttribute } from "../attr";
import { computeGraph } from "./graph";
import { expect } from "chai";

const TERMINAL_OPCODES = new Set<number>([
    Opcode.IRETURN, Opcode.LRETURN, Opcode.FRETURN, Opcode.DRETURN,
    Opcode.ARETURN, Opcode.RETURN, Opcode.ATHROW, Opcode.RET
]);

describe("graph computation", () => {
    const register = (path: string) => {
        const data = new Uint8Array(readFileSync(path));
        it(`analyze ${path}`, () => {
            const clazz = read(data);

            for (const method of clazz.methods) {
                const attr = method.attrs.find((a) => a.name === AttributeType.CODE);
                if (!attr) {
                    continue;
                }

                const code = attr as CodeAttribute;
                // console.log(`method ${method.name.decode()}${method.type.decode()}`);

                const graph = computeGraph(code.insns);
                /*for (let i = 0; i < graph.nodes.length; i++) {
                    const node = graph.nodes[i];
                    console.log(`${i}: ${node.insns.map((insn) => OPCODE_MNEMONICS[insn.opcode]).join(", ")}`);
                }
                for (let i = 0; i < graph.edges.length; i++) {
                    const edge = graph.edges[i];
                    console.log(`${edge.source} -> ${edge.target}`);
                }*/

                for (const node of graph.nodes) {
                    expect(node.insns.length).not.equal(0);
                    expect(node.leaf).equal(TERMINAL_OPCODES.has(node.insns[node.insns.length - 1].opcode));

                    if (node.leaf) {
                        for (const edge of graph.edges) {
                            expect(edge.source).not.equal(node.offset);
                        }
                    }
                }
            }
        });
    };

    const walk = (path: string) => {
        const dir = opendirSync(path);

        let entry: Dirent | null;
        while ((entry = dir.readSync()) !== null) {
            const childPath = join(path, entry.name);

            if (entry.isFile() && entry.name.endsWith(".class")) {
                register(childPath);
            } else if (entry.isDirectory()) {
                walk(childPath);
            }
        }

        dir.closeSync();
    };

    walk("./samples");
});
