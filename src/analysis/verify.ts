import type { DirtyMarkable, Node } from "../";
import type { Attributable, Attribute } from "../attr";
import { AttributeType, Modifier } from "../spec";

const enum AttributeContext {
    NONE = 0,
    CLASS = 1 << 0,
    FIELD = 1 << 1,
    METHOD = 1 << 2,
    RECORD_COMPONENT = 1 << 3,
    ATTRIBUTE = 1 << 4,
}

const getAllowedContext = (attr: Attribute): AttributeContext => {
    if (!attr.name) {
        return AttributeContext.NONE;
    }

    switch (attr.name.string) {
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
    return (
        AttributeContext.CLASS |
        AttributeContext.FIELD |
        AttributeContext.METHOD |
        AttributeContext.RECORD_COMPONENT |
        AttributeContext.ATTRIBUTE
    );
};

const checkSingle = (attr: Attribute, ctx: AttributeContext): boolean => {
    if ((getAllowedContext(attr) & ctx) === 0) {
        // attribute not allowed in context
        return false;
    }

    return true;
};

const check = (attrib: Attributable, ctx: AttributeContext): boolean => {
    let dirty = false;

    const valid = attrib.attrs.filter((a) => checkSingle(a, ctx));
    if (attrib.attrs.length > valid.length) {
        dirty = true; // one or more attributes were removed, dirty
    }

    attrib.attrs = valid;

    // check nested attributes
    for (const attr of attrib.attrs) {
        if ("attrs" in attr && check(attr as Attributable, AttributeContext.ATTRIBUTE)) {
            dirty = true; // a nested attribute is dirty, propagate
        }
    }

    if (dirty && "dirty" in attrib) {
        // mark ourselves as dirty
        (attrib as DirtyMarkable).dirty = true;
    }
    return dirty;
};

const filter = (attrib: Attributable, name: string): boolean => {
    const valid = attrib.attrs.filter((a) => a.name?.string !== name);
    const dirty = attrib.attrs.length > valid.length;

    attrib.attrs = valid;
    return dirty;
};

export const verify = (node: Node): Node => {
    check(node, AttributeContext.CLASS);
    for (const field of node.fields) {
        check(field, AttributeContext.FIELD);
    }
    for (const method of node.methods) {
        check(method, AttributeContext.METHOD);
        if ((method.access & Modifier.ABSTRACT) > 0) {
            // Code attributes are not allowed on abstract methods
            filter(method, AttributeType.CODE);
        }
    }

    return node; // in-place
};
