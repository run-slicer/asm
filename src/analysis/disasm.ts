import { AttributeType, Modifier } from "../spec";
import type { Node, Member } from "../";
import type { CodeAttribute } from "../attr";
import type { Pool, UTF8Entry } from "../pool";
import { formatInsn } from "../insn";

const enum NodeType {
    CLASS = "class",
    ENUM = "enum",
    INTERFACE = "interface",
    ANNOTATION = "@interface",
}

const enum ElementType {
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

const formatMod = (mod: number, element?: ElementType): string => {
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

interface ReferenceHolder {
    name(fqName: string): string;
    refs(): string[];
}

const emptyRefHolder: ReferenceHolder = {
    name(fqName: string): string {
        return fqName.replaceAll("/", ".");
    },
    refs(): string[] {
        return [];
    },
};

const createRefHolder = (): ReferenceHolder => {
    const refs = new Map<string, string>();

    return {
        name(fqName: string): string {
            fqName = fqName.replaceAll("/", ".");

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

const formatDesc = (desc: string, refHolder: ReferenceHolder = emptyRefHolder): string => {
    if (!desc) {
        return desc;
    }

    switch (desc[0]) {
        case "[":
            return `${formatDesc(desc.substring(1))}[]`;
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

const disassembleMethod0 = (method: Member, pool: Pool, indent: string, refHolder: ReferenceHolder): string => {
    let result = formatMod(method.access, ElementType.METHOD);

    const [args, returnType] = method.type.decode().substring(1).split(")", 2);
    result += `${formatDesc(returnType, refHolder)} ${method.name.decode()}(`;
    result += splitDescs(args)
        .map((desc) => formatDesc(desc, refHolder))
        .join(", ");
    result += ")";

    const code = method.attrs.find((a) => a.name === AttributeType.CODE);
    result += code ? ` {\n${block(disassembleCode(code as CodeAttribute, pool), indent)}}\n` : ";\n";

    return result;
};

const disassembleField = (field: Member, refHolder: ReferenceHolder): string => {
    return (
        formatMod(field.access, ElementType.FIELD) +
        `${formatDesc(field.type.decode(), refHolder)} ${field.name.decode()};\n`
    );
};

const disassemble0 = (node: Node, indent: string, refHolder: ReferenceHolder): string => {
    let nodeType = NodeType.CLASS;
    if ((node.access & Modifier.ANNOTATION) !== 0) {
        nodeType = NodeType.ANNOTATION;
    } else if ((node.access & Modifier.INTERFACE) !== 0) {
        nodeType = NodeType.INTERFACE;
    } else if ((node.access & Modifier.ENUM) !== 0) {
        nodeType = NodeType.ENUM;
    }

    let result = formatMod(
        node.access,
        nodeType === NodeType.CLASS || nodeType === NodeType.ENUM ? ElementType.CLASS : ElementType.INTERFACE
    );

    const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();
    result += `${nodeType} ${refHolder.name(name)} `;

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
        result += block(disassembleMethod0(method, node.pool, indent, refHolder), indent);
    }
    result += "}";

    return result;
};

export interface DisassemblyResult {
    code: string;
    references: string[]; // referenced classes, empty if fullyQualified is true
}

export interface DisassemblyOptions {
    indent: string; // the indentation string, defaults to 4 spaces
    fullyQualified: boolean; // whether class references should be fully qualified, defaults to true
}

const defaultOptions: DisassemblyOptions = {
    indent: "    ",
    fullyQualified: true,
};

export const disassembleMethod = (
    method: Member,
    pool: Pool,
    options: DisassemblyOptions = defaultOptions
): DisassemblyResult => {
    const refHolder = options.fullyQualified ? emptyRefHolder : createRefHolder();
    const code = disassembleMethod0(method, pool, options.indent, refHolder);

    return { code, references: refHolder.refs() };
};

export const disassemble = (node: Node, options: DisassemblyOptions = defaultOptions): DisassemblyResult => {
    const refHolder = options.fullyQualified ? emptyRefHolder : createRefHolder();
    const code = disassemble0(node, options.indent, refHolder);

    return { code, references: refHolder.refs() };
};
