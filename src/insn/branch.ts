import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";
import type { Instruction } from "./";

export interface BranchInstruction extends Instruction {
    opcode:
        | Opcode.IFEQ
        | Opcode.IFNE
        | Opcode.IFLT
        | Opcode.IFGE
        | Opcode.IFGT
        | Opcode.IFLE
        | Opcode.IF_ICMPEQ
        | Opcode.IF_ICMPNE
        | Opcode.IF_ICMPLT
        | Opcode.IF_ICMPGE
        | Opcode.IF_ICMPGT
        | Opcode.IF_ICMPLE
        | Opcode.IF_ACMPEQ
        | Opcode.IF_ACMPNE
        | Opcode.GOTO
        | Opcode.GOTO_W
        | Opcode.JSR
        | Opcode.JSR_W
        | Opcode.IFNULL
        | Opcode.IFNONNULL;
    branchOffset: number;
}

export const readBranch = (insn: Instruction): BranchInstruction => {
    const buffer = createBuffer(insn.operands);

    const wide = insn.opcode === Opcode.GOTO_W || insn.opcode === Opcode.JSR_W;
    return {
        ...insn,
        wide,
        branchOffset: wide ? buffer.readInt() : buffer.readShort(),
    };
};

export const writeBranch = (insn: BranchInstruction): Instruction => {
    const buffer = createMutableBuffer(insn.wide ? 4 : 2);
    if (insn.wide) {
        buffer.writeInt(insn.branchOffset);
    } else {
        buffer.writeShort(insn.branchOffset);
    }

    return { ...insn, operands: buffer.bufferView };
};
