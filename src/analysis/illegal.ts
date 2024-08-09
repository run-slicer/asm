import { AttributeType, Modifier } from "../spec";
import type { Attributable, Attribute } from "../attr";
import type { Node } from "../";

const enum AttributeContext {
    NONE = 0,
    CLASS = 1 << 0,
    FIELD = 1 << 1,
    METHOD = 1 << 2,
    RECORD_COMPONENT = 1 << 3,
    ATTRIBUTE = 1 << 4,
}

const getAttrContext = (attr: Attribute): AttributeContext => {
    if (!attr.name) {
        return AttributeContext.NONE;
    }

    switch (attr.name) {
        case AttributeType.BOOTSTRAP_METHODS:
        case AttributeType.ENCLOSING_METHOD:
        case AttributeType.INNER_CLASSES:
        case AttributeType.MODULE:
        case AttributeType.MODULE_MAIN_CLASS:
        case AttributeType.MODULE_PACKAGES:
        case AttributeType.NEST_HOST:
        case AttributeType.NEST_MEMBERS:
        case AttributeType.PERMITTED_SUBCLASSES:
        case AttributeType.RECORD:
        case AttributeType.SOURCE_DEBUG_EXTENSION:
        case AttributeType.SOURCE_FILE:
            return AttributeContext.CLASS;
        case AttributeType.CONSTANT_VALUE:
            return AttributeContext.FIELD;
        case AttributeType.ANNOTATION_DEFAULT:
        case AttributeType.CODE:
        case AttributeType.EXCEPTIONS:
        case AttributeType.METHOD_PARAMETERS:
        case AttributeType.RUNTIME_INVISIBLE_PARAMETER_ANNOTATIONS:
        case AttributeType.RUNTIME_VISIBLE_PARAMETER_ANNOTATIONS:
            return AttributeContext.METHOD;
        case AttributeType.DEPRECATED:
        case AttributeType.SYNTHETIC:
            return AttributeContext.CLASS | AttributeContext.FIELD | AttributeContext.METHOD;
        case AttributeType.LINE_NUMBER_TABLE:
        case AttributeType.LOCAL_VARIABLE_TABLE:
        case AttributeType.LOCAL_VARIABLE_TYPE_TABLE:
        case AttributeType.STACK_MAP_TABLE:
            return AttributeContext.ATTRIBUTE;
    }

    // all are allowed by default
    return AttributeContext.CLASS | AttributeContext.FIELD | AttributeContext.METHOD
        | AttributeContext.RECORD_COMPONENT | AttributeContext.ATTRIBUTE;
};

const checkSingle = (attr: Attribute, ctx: AttributeContext): boolean => {
    if ((getAttrContext(attr) & ctx) !== 0) {
        // attribute not allowed in context
        return false;
    }

    return true;
};

const check = (attrib: Attributable, ctx: AttributeContext) => {
    attrib.attrs = attrib.attrs.filter((a) => checkSingle(a, ctx));

    // check nested attributes
    for (const attr of attrib.attrs) {
        if ("attrs" in attr) {
            check(attr as Attributable, AttributeContext.ATTRIBUTE);
        }
    }
};

const filter = (attrib: Attributable, name: string) => {
    attrib.attrs = attrib.attrs.filter((a) => a.name !== name);
}

export const removeIllegal = (node: Node) => {
    check(node, AttributeContext.CLASS);
    for (const field of node.fields) {
        check(field, AttributeContext.FIELD);
    }
    for (const method of node.methods) {
        check(method, AttributeContext.METHOD);
        if ((method.access & Modifier.ABSTRACT) !== 0) {
            // Code attributes are not allowed on abstract methods
            filter(method, AttributeType.CODE);
        }
    }
};
