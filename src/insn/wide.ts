import type { Instruction } from "./index";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";
import { type LoadStoreInstruction, readLoadStore, writeLoadStore } from "./load_store";
import { type IncrementInstruction, readIinc, writeIinc } from "./iinc";

export interface WideInstruction extends Instruction {
    opcode: Opcode.WIDE;
    insn: Instruction;
}

export const readWide = (insn: Instruction): WideInstruction => {
    const buffer = createBuffer(insn.operands);
    const widenedInsn: Instruction = {
        opcode: buffer.readUnsignedByte(),
        operands: buffer.bufferView.subarray(1),
        offset: insn.offset + 1,
        length: insn.length - 1,
        dirty: false,
    };

    let wrappedInsn: Instruction;
    switch (widenedInsn.opcode) {
        case Opcode.ALOAD:
        case Opcode.ASTORE:
        case Opcode.DLOAD:
        case Opcode.DSTORE:
        case Opcode.FLOAD:
        case Opcode.FSTORE:
        case Opcode.ILOAD:
        case Opcode.ISTORE:
        case Opcode.LLOAD:
        case Opcode.LSTORE:
        case Opcode.RET:
            wrappedInsn = readLoadStore(widenedInsn);
            break;
        case Opcode.IINC:
            wrappedInsn = readIinc(widenedInsn);
            break;
        default:
            throw new Error(`Unrecognized wide opcode ${widenedInsn.opcode}`);
    }

    return { ...insn, insn: wrappedInsn };
};

export const writeWide = (wideInsn: WideInstruction): Instruction => {
    const insn = wideInsn.insn;
    if (insn.dirty) {
        switch (insn.opcode) {
            case Opcode.ALOAD:
            case Opcode.ASTORE:
            case Opcode.DLOAD:
            case Opcode.DSTORE:
            case Opcode.FLOAD:
            case Opcode.FSTORE:
            case Opcode.ILOAD:
            case Opcode.ISTORE:
            case Opcode.LLOAD:
            case Opcode.LSTORE:
            case Opcode.RET:
                wideInsn.insn = writeLoadStore(insn as LoadStoreInstruction);
                break;
            case Opcode.IINC:
                wideInsn.insn = writeIinc(insn as IncrementInstruction);
                break;
            default:
                throw new Error(`Unrecognized wide opcode ${insn.opcode}`);
        }

        insn.dirty = false;
    }

    const buffer = createMutableBuffer(1 + insn.operands.length);
    buffer.writeUnsignedByte(insn.opcode);
    buffer.write(insn.operands);

    return { ...wideInsn, operands: buffer.bufferView };
};
