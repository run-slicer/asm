import { Instruction, InstructionKind } from "./";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

export interface LoadStoreInstruction extends Instruction {
    kind: InstructionKind.LOAD_STORE;
    opcode:
        | Opcode.ALOAD
        | Opcode.ASTORE
        | Opcode.DLOAD
        | Opcode.DSTORE
        | Opcode.FLOAD
        | Opcode.FSTORE
        | Opcode.ILOAD
        | Opcode.ISTORE
        | Opcode.LLOAD
        | Opcode.LSTORE
        | Opcode.RET /* jsr return */;
    index: number;
}

export const readLoadStore = (insn: Instruction): LoadStoreInstruction => {
    const buffer = createBuffer(insn.operands);

    const wide = insn.operands.length > 1;
    return {
        ...insn,
        kind: InstructionKind.LOAD_STORE,
        wide,
        index: wide ? buffer.readUnsignedShort() : buffer.readUnsignedByte(),
    };
};

export const writeLoadStore = (insn: LoadStoreInstruction): Instruction => {
    const buffer = createMutableBuffer(insn.wide ? 2 : 1);
    if (insn.wide) {
        buffer.writeUnsignedShort(insn.index);
    } else {
        buffer.writeUnsignedByte(insn.index);
    }

    return { ...insn, operands: buffer.bufferView };
};
