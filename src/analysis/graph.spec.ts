import { type Dirent, opendirSync, readFileSync } from "node:fs";
import { read } from "../index";
import { join } from "node:path";
import { AttributeType, Opcode } from "../spec";
import type { CodeAttribute } from "../attr";
import { computeGraph } from "./graph";
import { expect } from "chai";
import type { Instruction, SwitchInstruction } from "../insn";

const TERMINAL_OPCODES = new Set<number>([
    Opcode.IRETURN,
    Opcode.LRETURN,
    Opcode.FRETURN,
    Opcode.DRETURN,
    Opcode.ARETURN,
    Opcode.RETURN,
    Opcode.ATHROW,
    Opcode.RET,
]);

const getExpectedEdges = (insn: Instruction): number => {
    switch (insn.opcode) {
        case Opcode.TABLESWITCH:
        case Opcode.LOOKUPSWITCH: {
            return 1 /* default offset */ + (insn as SwitchInstruction).jumpOffsets.length;
        }
        case Opcode.IFEQ:
        case Opcode.IFNE:
        case Opcode.IFLT:
        case Opcode.IFGE:
        case Opcode.IFGT:
        case Opcode.IFLE:
        case Opcode.IF_ICMPEQ:
        case Opcode.IF_ICMPNE:
        case Opcode.IF_ICMPLT:
        case Opcode.IF_ICMPGE:
        case Opcode.IF_ICMPGT:
        case Opcode.IF_ICMPLE:
        case Opcode.IF_ACMPEQ:
        case Opcode.IF_ACMPNE:
        case Opcode.JSR:
        case Opcode.JSR_W:
        case Opcode.IFNULL:
        case Opcode.IFNONNULL:
            return 2;
        case Opcode.IRETURN:
        case Opcode.LRETURN:
        case Opcode.FRETURN:
        case Opcode.DRETURN:
        case Opcode.ARETURN:
        case Opcode.RETURN:
        case Opcode.ATHROW:
        case Opcode.RET:
            return 0;
    }

    return 1; // goto and reconnections
};

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
                console.log(`method ${method.name.decode()}${method.type.decode()}`);

                const graph = computeGraph(code);
                for (let i = 0; i < graph.nodes.length; i++) {
                    const node = graph.nodes[i];
                    console.log(`${i}: ${node.insns.map((insn) => Opcode[insn.opcode]).join(", ")}`);

                    expect(node.insns.length).not.equal(0);

                    const lastInsn = node.insns[node.insns.length - 1];
                    expect(node.leaf).equal(TERMINAL_OPCODES.has(lastInsn.opcode));

                    let edgeCount = 0;
                    for (let j = 0; j < graph.edges.length; j++) {
                        const edge = graph.edges[j];
                        if (edge.source === node.offset) {
                            edgeCount++;
                            console.log(`edge ${j}: ${JSON.stringify(edge)}`);
                        }
                    }

                    expect(node.leaf).equal(edgeCount === 0);
                    expect(edgeCount).equal(getExpectedEdges(lastInsn));
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
