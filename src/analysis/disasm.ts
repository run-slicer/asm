import type { CodeAttribute } from "../attr";
import { Modifier } from "../spec";

enum ElementType {
    UNSPECIFIC,
    CLASS,
    INTERFACE,
    CONSTRUCTOR,
    METHOD,
    FIELD,
    PARAMETER,
}

export enum OwnerType {
    CLASS,
    INTERFACE,
    ENUM,
    ANNOTATION,
}

const modMasks: Record<ElementType, number> = {
    [ElementType.UNSPECIFIC]: 0,
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

const formatMod = (mod: number, element: ElementType, owner: OwnerType = OwnerType.CLASS): string => {
    let result = "";

    const masked = mod & modMasks[element];
    if ((masked & Modifier.PUBLIC) !== 0) {
        if (owner === OwnerType.INTERFACE) {
            // interface fields are implicitly public
            // see: https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.3

            // substitute the public modifier on implemented non-static interface methods with the default modifier
            // remove the public modifier on other interface methods, implicit
            // see: https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.4
            if (element === ElementType.METHOD && (masked & Modifier.ABSTRACT) === 0 && (masked & Modifier.STATIC) === 0) {
                result += "default ";
            }
        } else {
            result += "public ";
        }
    }
    if ((masked & Modifier.PRIVATE) !== 0) result += "private ";
    if ((masked & Modifier.PROTECTED) !== 0) result += "protected ";

    // interface fields are implicitly static
    // see: https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.3
    if ((masked & Modifier.STATIC) != 0 && (element !== ElementType.FIELD || owner !== OwnerType.INTERFACE)) {
        result += "static ";
    }

    // enums can have an abstract modifier (methods included) if its constants have a custom impl
    // TODO: should we remove that?

    // an interface and possibly some of its methods are implicitly abstract
    // we need to check the unmasked modifiers here, since ACC_INTERFACE is not among Modifier#interfaceModifiers
    if (
        (masked & Modifier.ABSTRACT) != 0
            && (element !== ElementType.INTERFACE || (mod & Modifier.INTERFACE) === 0)
            && (element !== ElementType.METHOD || owner !== OwnerType.INTERFACE)
    ) {
        result += "abstract ";
    }
    if ((masked & Modifier.FINAL) !== 0) {
        // interface fields are implicitly final
        // see: https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.3

        // enums and records are implicitly final
        // we need to check the unmasked modifiers here, since ACC_ENUM is not among Modifier#classModifiers
        if (
            (element !== ElementType.FIELD || owner !== OwnerType.INTERFACE)
                && (element !== ElementType.CLASS || ((mod & Modifier.ENUM) === 0/* && (mod & Modifier.RECORD) === 0*/))
        ) {
            result += "final ";
        }
    }
    if ((masked & Modifier.NATIVE) !== 0) result += "native ";
    if ((masked & Modifier.STRICT) !== 0) result += "strict ";
    if ((masked & Modifier.SYNCHRONIZED) !== 0) result += "synchronized ";
    if ((masked & Modifier.TRANSIENT) !== 0) result += "transient ";
    if ((masked & Modifier.VOLATILE) !== 0) result += "volatile ";

    return result;
};

export const disassemble = (code: CodeAttribute, owner: OwnerType = OwnerType.CLASS) => {};
