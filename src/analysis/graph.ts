import type { BranchInstruction, Instruction, SwitchInstruction } from "../insn";
import { Opcode } from "../spec";

const TERMINAL_OPCODES = new Set<number>([
    Opcode.IRETURN, Opcode.LRETURN, Opcode.FRETURN, Opcode.DRETURN,
    Opcode.ARETURN, Opcode.RETURN, Opcode.ATHROW, Opcode.RET
]);

export interface Node {
    offset: number;
    insns: Instruction[];
    leaf: boolean;
}

export interface Edge {
    source: number;
    target: number;
    jump: boolean;
}

export interface Graph {
    nodes: Node[];
    edges: Edge[];
}

const getTargetOffsets = (insn: Instruction): number[] => {
    switch (insn.opcode) {
        case Opcode.TABLESWITCH:
        case Opcode.LOOKUPSWITCH: {
            const { defaultOffset, jumpOffsets } = insn as SwitchInstruction;

            return [insn.offset + defaultOffset, ...jumpOffsets.map((offset) => insn.offset + offset)];
        }
        case Opcode.GOTO:
        case Opcode.GOTO_W:
            return [insn.offset + (insn as BranchInstruction).branchOffset];
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
            return [insn.offset + insn.length /* next offset */, insn.offset + (insn as BranchInstruction).branchOffset];
    }

    return [];
};

export const computeGraph = (insns: Instruction[]): Graph => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const insnTargets = insns.map(getTargetOffsets);
    const insnLeaders = new Set<number>(
        [
            0,
            ...insnTargets.flatMap((t, i) => {
                const insn = insns[i];

                // if we're jumping, the next instruction will always be in a new logical block
                return t.length > 0 ? [insn.offset + insn.length /* next offset */, ...t] : [];
            })
        ]
    );

    let currentNode: Node = { offset: -1, insns: [], leaf: true };
    for (let i = 0; i < insns.length; i++) {
        const insn = insns[i];
        if (insnLeaders.has(insn.offset)) {
            const lastInsn = insns[i - 1];
            if (lastInsn && !TERMINAL_OPCODES.has(lastInsn.opcode)) {
                currentNode.leaf = false;
                if (insnTargets[i - 1].length === 0) {
                    // didn't return/throw nor jump, reconnect
                    edges.push({ source: currentNode.offset, target: insn.offset, jump: false });
                }
            }

            currentNode = { offset: insn.offset, insns: [], leaf: true };
            nodes.push(currentNode);
        }

        currentNode.insns.push(insn);
        for (const targetOffset of insnTargets[i]) {
            edges.push({ source: currentNode.offset, target: targetOffset, jump: true });
        }
    }

    return { nodes, edges };
};
