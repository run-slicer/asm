import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";
import type { Instruction } from "./";

const TYPICAL_SWITCH_SIZE = 16;

export interface SwitchInstruction extends Instruction {
    opcode: Opcode.TABLESWITCH | Opcode.LOOKUPSWITCH;
    defaultOffset: number;
    jumpOffsets: number[];
}

export interface TableSwitchInstruction extends SwitchInstruction {
    opcode: Opcode.TABLESWITCH;
    lowCase: number;
    highCase: number;
}

export interface LookupSwitchInstruction extends SwitchInstruction {
    opcode: Opcode.LOOKUPSWITCH;
    cases: number[];
}

export const readSwitch = (insn: Instruction): SwitchInstruction => {
    const buffer = createBuffer(insn.operands);

    const switchInsn: Partial<SwitchInstruction> = {
        ...insn,
        defaultOffset: buffer.readInt(),
    };

    if (insn.opcode === Opcode.TABLESWITCH) {
        const tableSwInsn = switchInsn as TableSwitchInstruction;

        tableSwInsn.lowCase = buffer.readInt();
        tableSwInsn.highCase = buffer.readInt();

        const jumpOffsetCount = tableSwInsn.highCase - tableSwInsn.lowCase + 1;
        switchInsn.jumpOffsets = new Array<number>(jumpOffsetCount);

        for (let i = 0; i < jumpOffsetCount; i++) {
            switchInsn.jumpOffsets[i] = buffer.readInt();
        }
    } else if (insn.opcode === Opcode.LOOKUPSWITCH) {
        const lookupSwInsn = switchInsn as LookupSwitchInstruction;

        const jumpOffsetCount = buffer.readInt();
        lookupSwInsn.cases = new Array<number>(jumpOffsetCount);
        lookupSwInsn.jumpOffsets = new Array<number>(jumpOffsetCount);

        for (let i = 0; i < jumpOffsetCount; i++) {
            lookupSwInsn.cases[i] = buffer.readInt();
            lookupSwInsn.jumpOffsets[i] = buffer.readInt();
        }
    } else {
        throw new Error(`Unrecognized switch opcode ${insn.opcode}`);
    }

    return switchInsn as SwitchInstruction;
};

export const writeSwitch = (insn: SwitchInstruction, initialSize: number = TYPICAL_SWITCH_SIZE): Instruction => {
    const buffer = createMutableBuffer(initialSize);

    if (insn.opcode === Opcode.TABLESWITCH) {
        const tableSwInsn = insn as TableSwitchInstruction;

        buffer.writeInt(tableSwInsn.lowCase);
        buffer.writeInt(tableSwInsn.highCase);

        for (const jumpOffset of tableSwInsn.jumpOffsets) {
            buffer.writeInt(jumpOffset);
        }
    } else if (insn.opcode === Opcode.LOOKUPSWITCH) {
        const lookupSwInsn = insn as LookupSwitchInstruction;

        buffer.writeInt(lookupSwInsn.jumpOffsets.length);

        for (let i = 0; i < lookupSwInsn.jumpOffsets.length; i++) {
            buffer.writeInt(lookupSwInsn.cases[i]);
            buffer.writeInt(lookupSwInsn.jumpOffsets[i]);
        }
    } else {
        throw new Error(`Unrecognized switch opcode ${insn.opcode}`);
    }

    return { ...insn, operands: buffer.bufferView };
};
