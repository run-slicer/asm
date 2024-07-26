import { Opcode } from "./spec";

const operandLengths: Record<Opcode, number> = {
    [Opcode.NOP]: 0,
    [Opcode.ACONST_NULL]: 0,
    [Opcode.ICONST_M1]: 0,
    [Opcode.ICONST_0]: 0,
    [Opcode.ICONST_1]: 0,
    [Opcode.ICONST_2]: 0,
    [Opcode.ICONST_3]: 0,
    [Opcode.ICONST_4]: 0,
    [Opcode.ICONST_5]: 0,
    [Opcode.LCONST_0]: 0,
    [Opcode.LCONST_1]: 0,
    [Opcode.FCONST_0]: 0,
    [Opcode.FCONST_1]: 0,
    [Opcode.FCONST_2]: 0,
    [Opcode.DCONST_0]: 0,
    [Opcode.DCONST_1]: 0,
    [Opcode.BIPUSH]: 1,
    [Opcode.SIPUSH]: 2,
    [Opcode.LDC]: 1,
    [Opcode.LDC_W]: 2,
    [Opcode.LDC2_W]: 2,
    [Opcode.ILOAD]: 1,
    [Opcode.LLOAD]: 1,
    [Opcode.FLOAD]: 1,
    [Opcode.DLOAD]: 1,
    [Opcode.ALOAD]: 1,
    [Opcode.ILOAD_0]: 0,
    [Opcode.ILOAD_1]: 0,
    [Opcode.ILOAD_2]: 0,
    [Opcode.ILOAD_3]: 0,
    [Opcode.LLOAD_0]: 0,
    [Opcode.LLOAD_1]: 0,
    [Opcode.LLOAD_2]: 0,
    [Opcode.LLOAD_3]: 0,
    [Opcode.FLOAD_0]: 0,
    [Opcode.FLOAD_1]: 0,
    [Opcode.FLOAD_2]: 0,
    [Opcode.FLOAD_3]: 0,
    [Opcode.DLOAD_0]: 0,
    [Opcode.DLOAD_1]: 0,
    [Opcode.DLOAD_2]: 0,
    [Opcode.DLOAD_3]: 0,
    [Opcode.ALOAD_0]: 0,
    [Opcode.ALOAD_1]: 0,
    [Opcode.ALOAD_2]: 0,
    [Opcode.ALOAD_3]: 0,
    [Opcode.IALOAD]: 0,
    [Opcode.LALOAD]: 0,
    [Opcode.FALOAD]: 0,
    [Opcode.DALOAD]: 0,
    [Opcode.AALOAD]: 0,
    [Opcode.BALOAD]: 0,
    [Opcode.CALOAD]: 0,
    [Opcode.SALOAD]: 0,
    [Opcode.ISTORE]: 1,
    [Opcode.LSTORE]: 1,
    [Opcode.FSTORE]: 1,
    [Opcode.DSTORE]: 1,
    [Opcode.ASTORE]: 1,
    [Opcode.ISTORE_0]: 0,
    [Opcode.ISTORE_1]: 0,
    [Opcode.ISTORE_2]: 0,
    [Opcode.ISTORE_3]: 0,
    [Opcode.LSTORE_0]: 0,
    [Opcode.LSTORE_1]: 0,
    [Opcode.LSTORE_2]: 0,
    [Opcode.LSTORE_3]: 0,
    [Opcode.FSTORE_0]: 0,
    [Opcode.FSTORE_1]: 0,
    [Opcode.FSTORE_2]: 0,
    [Opcode.FSTORE_3]: 0,
    [Opcode.DSTORE_0]: 0,
    [Opcode.DSTORE_1]: 0,
    [Opcode.DSTORE_2]: 0,
    [Opcode.DSTORE_3]: 0,
    [Opcode.ASTORE_0]: 0,
    [Opcode.ASTORE_1]: 0,
    [Opcode.ASTORE_2]: 0,
    [Opcode.ASTORE_3]: 0,
    [Opcode.IASTORE]: 0,
    [Opcode.LASTORE]: 0,
    [Opcode.FASTORE]: 0,
    [Opcode.DASTORE]: 0,
    [Opcode.AASTORE]: 0,
    [Opcode.BASTORE]: 0,
    [Opcode.CASTORE]: 0,
    [Opcode.SASTORE]: 0,
    [Opcode.POP]: 0,
    [Opcode.POP2]: 0,
    [Opcode.DUP]: 0,
    [Opcode.DUP_X1]: 0,
    [Opcode.DUP_X2]: 0,
    [Opcode.DUP2]: 0,
    [Opcode.DUP2_X1]: 0,
    [Opcode.DUP2_X2]: 0,
    [Opcode.SWAP]: 0,
    [Opcode.IADD]: 0,
    [Opcode.LADD]: 0,
    [Opcode.FADD]: 0,
    [Opcode.DADD]: 0,
    [Opcode.ISUB]: 0,
    [Opcode.LSUB]: 0,
    [Opcode.FSUB]: 0,
    [Opcode.DSUB]: 0,
    [Opcode.IMUL]: 0,
    [Opcode.LMUL]: 0,
    [Opcode.FMUL]: 0,
    [Opcode.DMUL]: 0,
    [Opcode.IDIV]: 0,
    [Opcode.LDIV]: 0,
    [Opcode.FDIV]: 0,
    [Opcode.DDIV]: 0,
    [Opcode.IREM]: 0,
    [Opcode.LREM]: 0,
    [Opcode.FREM]: 0,
    [Opcode.DREM]: 0,
    [Opcode.INEG]: 0,
    [Opcode.LNEG]: 0,
    [Opcode.FNEG]: 0,
    [Opcode.DNEG]: 0,
    [Opcode.ISHL]: 0,
    [Opcode.LSHL]: 0,
    [Opcode.ISHR]: 0,
    [Opcode.LSHR]: 0,
    [Opcode.IUSHR]: 0,
    [Opcode.LUSHR]: 0,
    [Opcode.IAND]: 0,
    [Opcode.LAND]: 0,
    [Opcode.IOR]: 0,
    [Opcode.LOR]: 0,
    [Opcode.IXOR]: 0,
    [Opcode.LXOR]: 0,
    [Opcode.IINC]: 2,
    [Opcode.I2L]: 0,
    [Opcode.I2F]: 0,
    [Opcode.I2D]: 0,
    [Opcode.L2I]: 0,
    [Opcode.L2F]: 0,
    [Opcode.L2D]: 0,
    [Opcode.F2I]: 0,
    [Opcode.F2L]: 0,
    [Opcode.F2D]: 0,
    [Opcode.D2I]: 0,
    [Opcode.D2L]: 0,
    [Opcode.D2F]: 0,
    [Opcode.I2B]: 0,
    [Opcode.I2C]: 0,
    [Opcode.I2S]: 0,
    [Opcode.LCMP]: 0,
    [Opcode.FCMPL]: 0,
    [Opcode.FCMPG]: 0,
    [Opcode.DCMPL]: 0,
    [Opcode.DCMPG]: 0,
    [Opcode.IFEQ]: 2,
    [Opcode.IFNE]: 2,
    [Opcode.IFLT]: 2,
    [Opcode.IFGE]: 2,
    [Opcode.IFGT]: 2,
    [Opcode.IFLE]: 2,
    [Opcode.IF_ICMPEQ]: 2,
    [Opcode.IF_ICMPNE]: 2,
    [Opcode.IF_ICMPLT]: 2,
    [Opcode.IF_ICMPGE]: 2,
    [Opcode.IF_ICMPGT]: 2,
    [Opcode.IF_ICMPLE]: 2,
    [Opcode.IF_ACMPEQ]: 2,
    [Opcode.IF_ACMPNE]: 2,
    [Opcode.GOTO]: 2,
    [Opcode.JSR]: 2,
    [Opcode.RET]: 1,
    [Opcode.TABLESWITCH]: -1,
    [Opcode.LOOKUPSWITCH]: -1,
    [Opcode.IRETURN]: 0,
    [Opcode.LRETURN]: 0,
    [Opcode.FRETURN]: 0,
    [Opcode.DRETURN]: 0,
    [Opcode.ARETURN]: 0,
    [Opcode.RETURN]: 0,
    [Opcode.GETSTATIC]: 2,
    [Opcode.PUTSTATIC]: 2,
    [Opcode.GETFIELD]: 2,
    [Opcode.PUTFIELD]: 2,
    [Opcode.INVOKEVIRTUAL]: 2,
    [Opcode.INVOKESPECIAL]: 2,
    [Opcode.INVOKESTATIC]: 2,
    [Opcode.INVOKEINTERFACE]: 4,
    [Opcode.INVOKEDYNAMIC]: 4,
    [Opcode.NEW]: 2,
    [Opcode.NEWARRAY]: 1,
    [Opcode.ANEWARRAY]: 2,
    [Opcode.ARRAYLENGTH]: 0,
    [Opcode.ATHROW]: 0,
    [Opcode.CHECKCAST]: 2,
    [Opcode.INSTANCEOF]: 2,
    [Opcode.MONITORENTER]: 0,
    [Opcode.MONITOREXIT]: 0,
    [Opcode.WIDE]: -1,
    [Opcode.MULTIANEWARRAY]: 3,
    [Opcode.IFNULL]: 2,
    [Opcode.IFNONNULL]: 2,
    [Opcode.GOTO_W]: 4,
    [Opcode.JSR_W]: 4,
};

export interface Instruction {
    opcode: Opcode;
    operands: Uint8Array;
    offset: number;
}

export const readInsns = (data: Uint8Array): Instruction[] => {
    const insns: Instruction[] = [];

    let offset = 0;
    while (offset < data.length) {
        const insnOffset = offset;
        const opcode = data[offset++];

        let operandLength: number;
        switch (opcode) {
            case Opcode.LOOKUPSWITCH:
            case Opcode.TABLESWITCH: {
                offset += offset % 4 ? 4 - (offset % 4) : 0; // padding

                if (opcode === Opcode.TABLESWITCH) {
                    const low =
                        (data[offset + 4] << 24) |
                        (data[offset + 5] << 16) |
                        (data[offset + 6] << 8) |
                        data[offset + 7];
                    const high =
                        (data[offset + 8] << 24) |
                        (data[offset + 9] << 16) |
                        (data[offset + 10] << 8) |
                        data[offset + 11];
                    const numJumpOffsets = high - low + 1;

                    operandLength = 3 * 4 + numJumpOffsets * 4;
                } else {
                    const numPairs =
                        (data[offset + 4] << 24) |
                        (data[offset + 5] << 16) |
                        (data[offset + 6] << 8) |
                        data[offset + 7];

                    operandLength = 8 + numPairs * 8;
                }
                break;
            }
            case Opcode.WIDE:
                operandLength = data[offset] === Opcode.IINC ? 5 : 3;
                break;
            default:
                const length = operandLengths[opcode];
                if (!length) {
                    throw new Error(`Unrecognized opcode ${opcode} at position ${insnOffset}`);
                }

                operandLength = length;
                break;
        }

        insns.push({ opcode, operands: data.subarray(offset, offset + operandLength), offset: insnOffset });
        offset += operandLength;
    }

    return insns;
};

export const writeInsns = (insns: Instruction[]): Uint8Array => {
    const data: number[] = [];

    for (const { opcode, operands } of insns) {
        data.push(opcode);

        if (opcode === Opcode.TABLESWITCH || opcode === Opcode.LOOKUPSWITCH) {
            let padding = data.length % 4 ? 4 - (data.length % 4) : 0;
            while (padding-- > 0) {
                data.push(0);
            }
        }

        data.push(...operands);
    }

    return new Uint8Array(data);
};
