import type { BranchInstruction, Instruction, SwitchInstruction } from "../insn";
import { Opcode } from "../spec";

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

export interface Node {
    offset: number;
    insns: Instruction[];
    leaf: boolean;
}

export enum EdgeType {
    UNSPECIFIC,
    CONDITION_TRUE,
    CONDITION_FALSE,
    SWITCH_DEFAULT,
    SWITCH_BRANCH,
}

export interface Edge {
    type: EdgeType;
    source: number;
    target: number;
    jump: boolean;
}

export interface Graph {
    nodes: Node[];
    edges: Edge[];
}

interface TargetOffset {
    offset: number;
    type: EdgeType;
}

const getTargetOffsets = (insn: Instruction): TargetOffset[] => {
    switch (insn.opcode) {
        case Opcode.TABLESWITCH:
        case Opcode.LOOKUPSWITCH: {
            const { defaultOffset, jumpOffsets } = insn as SwitchInstruction;

            return [
                { offset: insn.offset + defaultOffset, type: EdgeType.SWITCH_DEFAULT },
                ...jumpOffsets.map((offset) => ({
                    offset: insn.offset + offset,
                    type: EdgeType.SWITCH_BRANCH,
                })),
            ];
        }
        case Opcode.GOTO:
        case Opcode.GOTO_W:
            return [{ offset: insn.offset + (insn as BranchInstruction).branchOffset, type: EdgeType.UNSPECIFIC }];
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
            return [
                { offset: insn.offset + insn.length /* next offset */, type: EdgeType.CONDITION_FALSE },
                { offset: insn.offset + (insn as BranchInstruction).branchOffset, type: EdgeType.CONDITION_TRUE },
            ];
    }

    return [];
};

export const computeGraph = (insns: Instruction[]): Graph => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const insnTargets = insns.map(getTargetOffsets);
    const insnLeaders = new Set<number>([
        0,
        ...insnTargets.flatMap((t, i) => {
            const insn = insns[i];

            // if we're jumping, the next instruction will always be in a new logical block
            return t.length > 0 ? [insn.offset + insn.length /* next offset */, ...t.map((o) => o.offset)] : [];
        }),
    ]);

    let currentNode: Node = { offset: -1, insns: [], leaf: true };
    for (let i = 0; i < insns.length; i++) {
        const insn = insns[i];
        if (insnLeaders.has(insn.offset)) {
            const lastInsn = insns[i - 1];
            if (lastInsn && !TERMINAL_OPCODES.has(lastInsn.opcode)) {
                currentNode.leaf = false;
                if (insnTargets[i - 1].length === 0) {
                    // didn't return/throw nor jump, reconnect
                    edges.push({
                        type: EdgeType.UNSPECIFIC,
                        source: currentNode.offset,
                        target: insn.offset,
                        jump: false,
                    });
                }
            }

            currentNode = { offset: insn.offset, insns: [], leaf: true };
            nodes.push(currentNode);
        }

        currentNode.insns.push(insn);
        for (const { type, offset } of insnTargets[i]) {
            edges.push({
                type,
                source: currentNode.offset,
                target: offset,
                jump: true,
            });
        }
    }

    return { nodes, edges };
};
