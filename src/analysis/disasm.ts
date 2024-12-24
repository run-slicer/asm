import { ArrayCode, AttributeType, ConstantType, HandleKind, Modifier, Opcode } from "../spec";
import type { Member, Node } from "../";
import type { CodeAttribute, SignatureAttribute, SourceFileAttribute } from "../attr";
import type {
    ClassEntry,
    DynamicEntry,
    Entry,
    HandleEntry,
    MethodTypeEntry,
    ModularEntry,
    NameTypeEntry,
    NumericEntry,
    Pool,
    RefEntry,
    StringEntry,
    UTF8Entry,
} from "../pool";
import type {
    ArrayInstruction,
    ConstantInstruction,
    IncrementInstruction,
    Instruction,
    InvokeInstruction,
    LoadStoreInstruction,
    PushInstruction,
    TypeInstruction,
    WideInstruction,
} from "../insn";

export enum NodeType {
    CLASS = "class",
    ENUM = "enum",
    INTERFACE = "interface",
    ANNOTATION = "@interface",
}

export enum ElementType {
    CLASS,
    INTERFACE,
    CONSTRUCTOR,
    METHOD,
    FIELD,
    PARAMETER,
}

const modMasks: Record<ElementType, number> = {
    [ElementType.CLASS]:
        Modifier.PUBLIC |
        Modifier.PROTECTED |
        Modifier.PRIVATE |
        Modifier.ABSTRACT |
        Modifier.STATIC |
        Modifier.FINAL |
        Modifier.STRICT,
    [ElementType.INTERFACE]:
        Modifier.PUBLIC | Modifier.PROTECTED | Modifier.PRIVATE | Modifier.ABSTRACT | Modifier.STATIC | Modifier.STRICT,
    [ElementType.CONSTRUCTOR]: Modifier.PUBLIC | Modifier.PROTECTED | Modifier.PRIVATE,
    [ElementType.METHOD]:
        Modifier.PUBLIC |
        Modifier.PROTECTED |
        Modifier.PRIVATE |
        Modifier.ABSTRACT |
        Modifier.STATIC |
        Modifier.FINAL |
        Modifier.SYNCHRONIZED |
        Modifier.NATIVE |
        Modifier.STRICT,
    [ElementType.FIELD]:
        Modifier.PUBLIC |
        Modifier.PROTECTED |
        Modifier.PRIVATE |
        Modifier.STATIC |
        Modifier.FINAL |
        Modifier.TRANSIENT |
        Modifier.VOLATILE,
    [ElementType.PARAMETER]: Modifier.FINAL,
};

export const formatMod = (mod: number, element?: ElementType): string => {
    mod = mod & (element ? modMasks[element] || 0 : 0);

    let result = "";
    if ((mod & Modifier.PUBLIC) !== 0) result += "public ";
    if ((mod & Modifier.PRIVATE) !== 0) result += "private ";
    if ((mod & Modifier.PROTECTED) !== 0) result += "protected ";
    if ((mod & Modifier.STATIC) !== 0) result += "static ";
    if ((mod & Modifier.ABSTRACT) !== 0) result += "abstract ";
    if ((mod & Modifier.FINAL) !== 0) result += "final ";
    if ((mod & Modifier.NATIVE) !== 0) result += "native ";
    if ((mod & Modifier.STRICT) !== 0) result += "strict ";
    if ((mod & Modifier.SYNCHRONIZED) !== 0) result += "synchronized ";
    if ((mod & Modifier.TRANSIENT) !== 0) result += "transient ";
    if ((mod & Modifier.VOLATILE) !== 0) result += "volatile ";

    return result;
};

const baseEscapes = new Map<string, string>(
    Object.entries({
        "\b": "\\b",
        "\t": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\",
        "'": "\\'",
    })
);

const literalEscapes = new Map<string, string>(
    Object.entries({
        " ": "\\u0020",
        ",": "\\u002C",
        ".": "\\u002E",
        ":": "\\u003A",
        "{": "\\u007B",
        "}": "\\u007D",
        '"': "\\u0022",
        "'": "\\u0027",
    })
);

const literalUnicodeEscapeRanges: { start: number; end: number }[] = [
    { start: 0x0000, end: 0x001f },
    { start: 0x007f, end: 0x009f },
    { start: 0x06e5, end: 0x06e5 },
    { start: 0x17b4, end: 0x17b4 },
    { start: 0x180b, end: 0x180e },
    { start: 0x2000, end: 0x200e },
    { start: 0x2028, end: 0x202e },
    { start: 0x205f, end: 0x206e },
    { start: 0x2400, end: 0x243e },
    { start: 0xe000, end: 0xf8ff },
    { start: 0xfe00, end: 0xfe0f },
    { start: 0xfe1a, end: 0xfe20 },
    { start: 0xfff0, end: 0xffff },
];

for (const range of literalUnicodeEscapeRanges) {
    for (let i = range.start; i <= range.end; i++) {
        baseEscapes.set(String.fromCharCode(i), `\\u${i.toString(16).toUpperCase().padStart(4, "0")}`);
    }
}

for (const [value, key] of baseEscapes) {
    literalEscapes.set(key, value);
}

export const escapeString = (s: string): string =>
    Array.from(s)
        .map((char) => baseEscapes.get(char) ?? char)
        .join("");

export const escapeLiteral = (s: string): string =>
    Array.from(s)
        .map((char) => literalEscapes.get(char) ?? char)
        .join("");

export const formatEntry = (entry: Entry, pool: Pool): string => {
    switch (entry.type) {
        case ConstantType.UTF8:
            return (entry as UTF8Entry).decode();
        case ConstantType.INTEGER:
        case ConstantType.FLOAT:
        case ConstantType.LONG:
        case ConstantType.DOUBLE:
            return (entry as NumericEntry<any>).value.toString();
        case ConstantType.CLASS:
            return escapeLiteral(formatEntry(pool[(entry as ClassEntry).name]!, pool));
        case ConstantType.STRING:
            return `"${escapeString(formatEntry(pool[(entry as StringEntry).data]!, pool))}"`;
        case ConstantType.METHOD_TYPE:
            return formatEntry(pool[(entry as MethodTypeEntry).descriptor]!, pool);
        case ConstantType.MODULE:
            return escapeString(formatEntry(pool[(entry as ModularEntry).name]!, pool));
        case ConstantType.PACKAGE:
            return escapeLiteral(formatEntry(pool[(entry as ModularEntry).name]!, pool));
        case ConstantType.FIELDREF:
        case ConstantType.METHODREF:
        case ConstantType.INTERFACE_METHODREF: {
            const refEntry = entry as RefEntry;

            return `${formatEntry(pool[refEntry.ref]!, pool)} ${formatEntry(pool[refEntry.nameType]!, pool)}`;
        }
        case ConstantType.NAME_AND_TYPE: {
            const ntEntry = entry as NameTypeEntry;

            return `${escapeLiteral((pool[ntEntry.name] as UTF8Entry).decode())} ${escapeLiteral((pool[ntEntry.type_] as UTF8Entry).decode())}`;
        }
        case ConstantType.DYNAMIC:
        case ConstantType.INVOKE_DYNAMIC: {
            const dynEntry = entry as DynamicEntry;

            return `${dynEntry.bsmIndex} ${formatEntry(pool[dynEntry.nameType]!, pool)}`;
        }
        case ConstantType.METHOD_HANDLE:
            const handleEntry = entry as HandleEntry;

            return `${HandleKind[handleEntry.kind].toLowerCase()} ${formatEntry(pool[handleEntry.ref]!, pool)}`;
        default:
            throw new Error("Unrecognized constant pool tag " + entry.type);
    }
};

export const formatInsn = (insn: Instruction, pool: Pool): string => {
    let value = Opcode[insn.opcode]?.toLowerCase() || "<unknown opcode>";
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
            value += ` ${(insn as LoadStoreInstruction).index}`;
            break;
        case Opcode.GETFIELD:
        case Opcode.GETSTATIC:
        case Opcode.PUTFIELD:
        case Opcode.PUTSTATIC:
            value += ` ${formatEntry(pool[(insn as LoadStoreInstruction).index]!, pool)}`;
            break;
        case Opcode.IINC: {
            const iincInsn = insn as IncrementInstruction;

            value += ` ${iincInsn.index} ${iincInsn.const}`;
            break;
        }
        case Opcode.WIDE:
            value += ` ${formatInsn((insn as WideInstruction).insn, pool)}`;
            break;
        case Opcode.INVOKEDYNAMIC:
        case Opcode.INVOKEINTERFACE:
        case Opcode.INVOKESPECIAL:
        case Opcode.INVOKESTATIC:
        case Opcode.INVOKEVIRTUAL:
            value += ` ${formatEntry(pool[(insn as InvokeInstruction).ref]!, pool)}`;
            break;
        case Opcode.LDC:
        case Opcode.LDC_W:
        case Opcode.LDC2_W:
            value += ` ${formatEntry(pool[(insn as ConstantInstruction).index]!, pool)}`;
            break;
        case Opcode.CHECKCAST:
        case Opcode.INSTANCEOF:
        case Opcode.NEW:
            value += ` ${formatEntry(pool[(insn as TypeInstruction).index]!, pool)}`;
            break;
        case Opcode.BIPUSH:
        case Opcode.SIPUSH:
            value += ` ${(insn as PushInstruction).value}`;
            break;
        case Opcode.ANEWARRAY:
        case Opcode.NEWARRAY:
        case Opcode.MULTIANEWARRAY: {
            const arrayInsn = insn as ArrayInstruction;
            const arrayCode = ArrayCode[arrayInsn.type];

            value += ` ${arrayCode ? arrayCode.substring(2).toLowerCase() : formatEntry(pool[arrayInsn.type]!, pool)}`;
            if (arrayInsn.opcode === Opcode.MULTIANEWARRAY) {
                value += ` ${arrayInsn.dimensions}`;
            }
            break;
        }
    }

    return value;
};

interface ReferenceHolder {
    name(fqName: string): string;
    refs(): string[];
}

const emptyRefHolder: ReferenceHolder = {
    name(fqName: string): string {
        return escapeLiteral(fqName).replaceAll("/", ".");
    },
    refs(): string[] {
        return [];
    },
};

const createRefHolder = (): ReferenceHolder => {
    const refs = new Map<string, string>();

    return {
        name(fqName: string): string {
            fqName = escapeLiteral(fqName).replaceAll("/", ".");

            const index = fqName.lastIndexOf(".");
            if (index === -1) {
                return fqName; // default package
            }

            const simpleName = fqName.substring(index + 1);

            const existingName = refs.get(simpleName);
            if (existingName) {
                if (existingName !== fqName) {
                    return fqName; // conflict, use fully qualified name
                }

                // entry found
                return simpleName;
            }

            // no conflict and no entry
            refs.set(simpleName, fqName);
            return simpleName;
        },
        refs(): string[] {
            return Array.from(refs.values());
        },
    };
};

const primTypes: Record<string, string> = {
    B: "byte",
    C: "char",
    D: "double",
    F: "float",
    I: "int",
    J: "long",
    S: "short",
    Z: "boolean",
    V: "void",
};

const formatDesc = (desc: string, refHolder: ReferenceHolder): string => {
    if (!desc) {
        return desc;
    }

    switch (desc[0]) {
        case "[":
            return `${formatDesc(desc.substring(1), refHolder)}[]`;
        case "L":
            return refHolder.name(desc.substring(1, desc.length - 1));
    }
    return primTypes[desc] || desc.replaceAll("/", ".");
};

const splitDescs = (descs: string): string[] => {
    const args: string[] = [];
    for (let i = 0; i < descs.length; i++) {
        const char = descs.charAt(i);

        const start = i;
        switch (char) {
            case "L": {
                i = descs.indexOf(";", i);
                args.push(descs.substring(start, i + 1));
                break;
            }
            case "[": {
                while (descs.charAt(i) === "[") {
                    i++;
                }
                if (descs.charAt(i) === "L") {
                    i = descs.indexOf(";", i);
                }

                args.push(descs.substring(start, i + 1));
                break;
            }
            default: {
                args.push(char);
                break;
            }
        }
    }

    return args;
};

const block = (s: string, indent: string): string => s.replaceAll(/^(?!\s*$)/gm, indent);

const disassembleCode = (code: CodeAttribute, pool: Pool): string => {
    let result = "";
    for (const insn of code.insns) {
        result += `// ${formatInsn(insn, pool)}\n`;
    }

    return result;
};

const disassembleMethod0 = (
    node: Node,
    method: Member,
    indent: string,
    refHolder: ReferenceHolder,
    writeRefs: boolean
): string => {
    let result = "";

    const signature = method.attrs.find((a) => a.name === AttributeType.SIGNATURE);
    if (signature) {
        result += `// Signature: ${escapeString((signature as SignatureAttribute).signatureEntry?.decode())}\n`;
    }

    const isStatic = (method.access & Modifier.STATIC) !== 0;

    let name = method.name.decode();
    if (name === "<clinit>" && isStatic) {
        result += "static"; // static initializer
    } else {
        const isConstructor = name === "<init>";

        result += formatMod(method.access, isConstructor ? ElementType.CONSTRUCTOR : ElementType.METHOD);

        const [args, returnType] = method.type.decode().substring(1).split(")", 2);
        if (isConstructor) {
            const nodeName = (node.pool[node.thisClass.name] as UTF8Entry).decode();
            refHolder.name(nodeName); // reserve name

            name = nodeName.substring(nodeName.lastIndexOf("/") + 1);
        } else {
            result += `${formatDesc(returnType, refHolder)} `;
        }

        result += `${escapeLiteral(name)}(`;
        result += splitDescs(args)
            .map((desc, i) => `${formatDesc(desc, refHolder)} var${i + (isStatic ? 0 : 1)}`)
            .join(", ");
        result += ")";
    }

    const code = method.attrs.find((a) => a.name === AttributeType.CODE);
    result += code ? ` {\n${block(disassembleCode(code as CodeAttribute, node.pool), indent)}}\n` : ";\n";

    if (writeRefs) {
        const refs = refHolder.refs();
        if (refs.length > 0) {
            result = refs.map((r) => `import ${r};`).join("\n") + "\n\n" + result;
        }
    }

    return result;
};

const disassembleField = (field: Member, refHolder: ReferenceHolder): string => {
    let result = "";

    const signature = field.attrs.find((a) => a.name === AttributeType.SIGNATURE);
    if (signature) {
        result += `// Signature: ${escapeString((signature as SignatureAttribute).signatureEntry?.decode())}\n`;
    }

    result += formatMod(field.access, ElementType.FIELD);
    result += `${formatDesc(field.type.decode(), refHolder)} ${escapeLiteral(field.name.decode())};\n`;

    return result;
};

const disassemble0 = (node: Node, indent: string, refHolder: ReferenceHolder, writeRefs: boolean): string => {
    let nodeType = NodeType.CLASS;
    if ((node.access & Modifier.ANNOTATION) !== 0) {
        nodeType = NodeType.ANNOTATION;
    } else if ((node.access & Modifier.INTERFACE) !== 0) {
        nodeType = NodeType.INTERFACE;
    } else if ((node.access & Modifier.ENUM) !== 0) {
        nodeType = NodeType.ENUM;
    }

    let result = "";

    const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();
    refHolder.name(name); // reserve name

    const slashIndex = name.lastIndexOf("/");
    const packageName = slashIndex !== -1 ? name.substring(0, slashIndex) : null;
    const simpleName = slashIndex !== -1 ? name.substring(slashIndex + 1) : name;

    const signature = node.attrs.find((a) => a.name === AttributeType.SIGNATURE);
    if (signature) {
        result += `// Signature: ${escapeString((signature as SignatureAttribute).signatureEntry?.decode())}\n`;
    }

    result += formatMod(
        node.access,
        nodeType === NodeType.CLASS || nodeType === NodeType.ENUM ? ElementType.CLASS : ElementType.INTERFACE
    );

    result += `${nodeType} ${escapeLiteral(simpleName)} `;

    if (node.superClass) {
        const superName = (node.pool[node.superClass.name] as UTF8Entry).decode();
        result += `extends ${refHolder.name(superName)} `;
    }
    if (node.interfaces.length !== 0) {
        const ifNames = node.interfaces.map((i) => refHolder.name((node.pool[i.name] as UTF8Entry).decode()));
        result += `implements ${ifNames.join(", ")} `;
    }

    result += "{\n";
    for (const method of node.fields) {
        result += block(disassembleField(method, refHolder), indent);
    }
    if (node.fields.length !== 0) result += "\n"; // spacer
    for (const method of node.methods) {
        result += block(disassembleMethod0(node, method, indent, refHolder, false), indent);
    }
    result += "}";

    if (writeRefs) {
        const refs = refHolder.refs();
        if (refs.length > 0) {
            result =
                refs
                    .filter((r) => r !== name)
                    .map((r) => `import ${r};`)
                    .join("\n") +
                "\n\n" +
                result;
        }
    }
    if (packageName) {
        result = `package ${escapeLiteral(packageName).replaceAll("/", ".")};\n\n` + result;
    }
    const sourceFile = node.attrs.find((a) => a.name === AttributeType.SOURCE_FILE);
    if (sourceFile) {
        result =
            `// Source file: ${escapeString((sourceFile as SourceFileAttribute).sourceFileEntry?.decode())}\n` + result;
    }

    return result;
};

export interface DisassemblyOptions {
    indent: string; // the indentation string, defaults to 4 spaces
    fullyQualified: boolean; // whether class references should be fully qualified, defaults to true
}

const defaultOptions: DisassemblyOptions = {
    indent: "    ",
    fullyQualified: true,
};

export const disassembleMethod = (node: Node, method: Member, options: DisassemblyOptions = defaultOptions): string => {
    const refHolder = options.fullyQualified ? emptyRefHolder : createRefHolder();

    return disassembleMethod0(node, method, options.indent, refHolder, true);
};

export const disassemble = (node: Node, options: DisassemblyOptions = defaultOptions): string => {
    const refHolder = options.fullyQualified ? emptyRefHolder : createRefHolder();

    return disassemble0(node, options.indent, refHolder, true);
};
