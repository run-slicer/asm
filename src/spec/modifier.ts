// This file was generated on 2024-08-03 12:11:11.669202. Do not edit, changes will be overwritten!

/** JVM access flags. */
export enum Modifier {
	/**
	 * `ACC_PUBLIC` access flag, integer value `1`.
	 *
	 * Applicable for:
	 *  - `class` - Declared public; may be accessed from outside its package.
	 *  - `field` - Declared public; may be accessed from outside its package.
	 *  - `method` - Declared public; may be accessed from outside its package.
	 */
	PUBLIC = 0x1,

	/**
	 * `ACC_PRIVATE` access flag, integer value `2`.
	 *
	 * Applicable for:
	 *  - `field` - Declared private; accessible only within the defining class and other classes belonging to the same nest (§5.4.4).
	 *  - `method` - Declared private; accessible only within the defining class and other classes belonging to the same nest (§5.4.4).
	 */
	PRIVATE = 0x2,

	/**
	 * `ACC_PROTECTED` access flag, integer value `4`.
	 *
	 * Applicable for:
	 *  - `field` - Declared protected; may be accessed within subclasses.
	 *  - `method` - Declared protected; may be accessed within subclasses.
	 */
	PROTECTED = 0x4,

	/**
	 * `ACC_STATIC` access flag, integer value `8`.
	 *
	 * Applicable for:
	 *  - `field` - Declared static.
	 *  - `method` - Declared static.
	 */
	STATIC = 0x8,

	/**
	 * `ACC_FINAL` access flag, integer value `16`.
	 *
	 * Applicable for:
	 *  - `class` - Declared final; no subclasses allowed.
	 *  - `field` - Declared final; never directly assigned to after object construction (JLS §17.5).
	 *  - `method` - Declared final; must not be overridden (§5.4.5).
	 */
	FINAL = 0x10,

	/**
	 * `ACC_SUPER` access flag, integer value `32`.
	 *
	 * Applicable for:
	 *  - `class` - Treat superclass methods specially when invoked by the invokespecial instruction.
	 */
	SUPER = 0x20,

	/**
	 * `ACC_SYNCHRONIZED` access flag, integer value `32`.
	 *
	 * Applicable for:
	 *  - `method` - Declared synchronized; invocation is wrapped by a monitor use.
	 */
	SYNCHRONIZED = 0x20,

	/**
	 * `ACC_VOLATILE` access flag, integer value `64`.
	 *
	 * Applicable for:
	 *  - `field` - Declared volatile; cannot be cached.
	 */
	VOLATILE = 0x40,

	/**
	 * `ACC_BRIDGE` access flag, integer value `64`.
	 *
	 * Applicable for:
	 *  - `method` - A bridge method, generated by the compiler.
	 */
	BRIDGE = 0x40,

	/**
	 * `ACC_TRANSIENT` access flag, integer value `128`.
	 *
	 * Applicable for:
	 *  - `field` - Declared transient; not written or read by a persistent object manager.
	 */
	TRANSIENT = 0x80,

	/**
	 * `ACC_VARARGS` access flag, integer value `128`.
	 *
	 * Applicable for:
	 *  - `method` - Declared with variable number of arguments.
	 */
	VARARGS = 0x80,

	/**
	 * `ACC_NATIVE` access flag, integer value `256`.
	 *
	 * Applicable for:
	 *  - `method` - Declared native; implemented in a language other than the Java programming language.
	 */
	NATIVE = 0x100,

	/**
	 * `ACC_INTERFACE` access flag, integer value `512`.
	 *
	 * Applicable for:
	 *  - `class` - Is an interface, not a class.
	 */
	INTERFACE = 0x200,

	/**
	 * `ACC_ABSTRACT` access flag, integer value `1024`.
	 *
	 * Applicable for:
	 *  - `class` - Declared abstract; must not be instantiated.
	 *  - `method` - Declared abstract; no implementation is provided.
	 */
	ABSTRACT = 0x400,

	/**
	 * `ACC_STRICT` access flag, integer value `2048`.
	 *
	 * Applicable for:
	 *  - `method` - In a class file whose major version number is at least 46 and at most 60: Declared strictfp.
	 */
	STRICT = 0x800,

	/**
	 * `ACC_SYNTHETIC` access flag, integer value `4096`.
	 *
	 * Applicable for:
	 *  - `class` - Declared synthetic; not present in the source code.
	 *  - `field` - Declared synthetic; not present in the source code.
	 *  - `method` - Declared synthetic; not present in the source code.
	 */
	SYNTHETIC = 0x1000,

	/**
	 * `ACC_ANNOTATION` access flag, integer value `8192`.
	 *
	 * Applicable for:
	 *  - `class` - Declared as an annotation interface.
	 */
	ANNOTATION = 0x2000,

	/**
	 * `ACC_ENUM` access flag, integer value `16384`.
	 *
	 * Applicable for:
	 *  - `class` - Declared as an enum class.
	 *  - `field` - Declared as an element of an enum class.
	 */
	ENUM = 0x4000,

	/**
	 * `ACC_MODULE` access flag, integer value `32768`.
	 *
	 * Applicable for:
	 *  - `class` - Is a module, not a class or interface.
	 */
	MODULE = 0x8000,
}
