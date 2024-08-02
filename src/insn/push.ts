import { Instruction } from "./";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

export interface PushInstruction extends Instruction {
    opcode: Opcode.BIPUSH | Opcode.SIPUSH;
    value: number;
}

export const readPush = (insn: Instruction): PushInstruction => {
    const buffer = createBuffer(insn.operands);

    return {
        ...insn,
        value: insn.opcode === Opcode.SIPUSH ? buffer.readUnsignedShort() : buffer.readUnsignedByte(),
    };
};

export const writePush = (insn: PushInstruction): Instruction => {
    const short = insn.opcode === Opcode.SIPUSH;

    const buffer = createMutableBuffer(short ? 2 : 1);
    if (short) {
        buffer.writeUnsignedShort(insn.value);
    } else {
        buffer.writeUnsignedByte(insn.value);
    }

    return { ...insn, operands: buffer.bufferView };
};
