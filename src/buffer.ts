// An offset-tracking DataView abstraction. (c) 2024 zlataovce (github.com/zlataovce)
// License: Public domain (or MIT if needed). Attribution appreciated.
// https://gist.github.com/zlataovce/42b87282e33bef4295981e177754dc13
const DEFAULT_BUFFER_SIZE = 1024;
const DEFAULT_RESIZE = 32;
const DEFAULT_LITTLE_ENDIAN = false; // bytecode is big endian

export interface Buffer {
    view: DataView;
    arrayView: Uint8Array;

    offset: number;
    littleEndian?: boolean;

    get(length: number, copy?: boolean): Uint8Array;
    getFloat32(): number;
    getFloat64(): number;
    getInt8(): number;
    getInt16(): number;
    getInt32(): number;
    getUint8(): number;
    getUint16(): number;
    getUint32(): number;
    getBigInt64(): bigint;
    getBigUint64(): bigint;

    set(value: Uint8Array): void;
    setFloat32(value: number): void;
    setFloat64(value: number): void;
    setInt8(value: number): void;
    setInt16(value: number): void;
    setInt32(value: number): void;
    setUint8(value: number): void;
    setUint16(value: number): void;
    setUint32(value: number): void;
    setBigInt64(value: bigint): void;
    setBigUint64(value: bigint): void;
}

const viewToArray = (view: DataView): Uint8Array => {
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
};

const ensureCapacity = (buffer: Buffer, needed: number) => {
    if (needed <= 0) {
        return;
    }

    const newSize = buffer.offset + needed;
    if (newSize > buffer.view.buffer.byteLength) {
        const newBuffer = new ArrayBuffer(newSize + DEFAULT_RESIZE);
        new Uint8Array(newBuffer, 0, buffer.view.byteLength).set(viewToArray(buffer.view));

        buffer.view = new DataView(newBuffer, 0, newSize);
    } else {
        buffer.view = new DataView(buffer.view.buffer, buffer.view.byteOffset, newSize);
    }
};

export const wrap = (buf: Uint8Array, littleEndian: boolean = DEFAULT_LITTLE_ENDIAN): Buffer => {
    return {
        view: new DataView(buf.buffer, buf.byteOffset, buf.byteLength),
        offset: 0,
        littleEndian,

        get arrayView(): Uint8Array {
            return viewToArray(this.view);
        },

        get(length: number, copy: boolean = false): Uint8Array {
            if (this.offset + length > this.view.byteLength) {
                throw new Error(`Wanted ${length} byte(s), ${this.view.byteLength - this.offset} remaining`);
            }

            const baseOffset = this.view.byteOffset + this.offset;
            const value = copy
                ? new Uint8Array(this.view.buffer.slice(baseOffset, baseOffset + length))
                : new Uint8Array(this.view.buffer, baseOffset, length);

            this.offset += length;
            return value;
        },
        getBigInt64(): bigint {
            const value = this.view.getBigInt64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;
        },
        getBigUint64(): bigint {
            const value = this.view.getBigUint64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;
        },
        getFloat32(): number {
            const value = this.view.getFloat32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;
        },
        getFloat64(): number {
            const value = this.view.getFloat64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;
        },
        getInt16(): number {
            const value = this.view.getInt16(this.offset, this.littleEndian);
            this.offset += 2;
            return value;
        },
        getInt32(): number {
            const value = this.view.getInt32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;
        },
        getInt8(): number {
            const value = this.view.getInt8(this.offset);
            this.offset += 1;
            return value;
        },
        getUint16(): number {
            const value = this.view.getUint16(this.offset, this.littleEndian);
            this.offset += 2;
            return value;
        },
        getUint32(): number {
            const value = this.view.getUint32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;
        },
        getUint8(): number {
            const value = this.view.getUint8(this.offset);
            this.offset += 1;
            return value;
        },

        set(value: Uint8Array): void {
            ensureCapacity(this, value.length);
            new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, value.length).set(value);
            this.offset += value.length;
        },
        setBigInt64(value: bigint): void {
            ensureCapacity(this, 8);
            this.view.setBigInt64(this.offset, value, this.littleEndian);
            this.offset += 8;
        },
        setBigUint64(value: bigint): void {
            ensureCapacity(this, 8);
            this.view.setBigUint64(this.offset, value, this.littleEndian);
            this.offset += 8;
        },
        setFloat32(value: number): void {
            ensureCapacity(this, 4);
            this.view.setFloat32(this.offset, value, this.littleEndian);
            this.offset += 4;
        },
        setFloat64(value: number): void {
            ensureCapacity(this, 8);
            this.view.setFloat64(this.offset, value, this.littleEndian);
            this.offset += 8;
        },
        setInt16(value: number): void {
            ensureCapacity(this, 2);
            this.view.setInt16(this.offset, value, this.littleEndian);
            this.offset += 2;
        },
        setInt32(value: number): void {
            ensureCapacity(this, 4);
            this.view.setInt32(this.offset, value, this.littleEndian);
            this.offset += 4;
        },
        setInt8(value: number): void {
            ensureCapacity(this, 1);
            this.view.setInt8(this.offset, value);
            this.offset += 1;
        },
        setUint16(value: number): void {
            ensureCapacity(this, 2);
            this.view.setUint16(this.offset, value, this.littleEndian);
            this.offset += 2;
        },
        setUint32(value: number): void {
            ensureCapacity(this, 4);
            this.view.setUint32(this.offset, value, this.littleEndian);
            this.offset += 4;
        },
        setUint8(value: number): void {
            ensureCapacity(this, 1);
            this.view.setUint8(this.offset, value);
            this.offset += 1;
        },
    };
};

export const create = (
    initialSize: number = DEFAULT_BUFFER_SIZE,
    littleEndian: boolean = DEFAULT_LITTLE_ENDIAN
): Buffer => {
    return wrap(new Uint8Array(new ArrayBuffer(initialSize), 0, 0), littleEndian);
};
