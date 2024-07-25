export interface ByteBuffer {
    buffer: ArrayBuffer;
    view: DataView;
    offset: number;

    read(n: number): ArrayBuffer;
    readByte(): number;
    readUnsignedByte(): number;
    readShort(): number;
    readUnsignedShort(): number;
    readInt(): number;
    readUnsignedInt(): number;
    readFloat(): number;
}

export interface MutableByteBuffer extends ByteBuffer {
    ensureCapacity(needed: number): void;

    write(buf: ArrayBuffer): void;
    writeByte(v: number): void;
    writeUnsignedByte(v: number): void;
    writeShort(v: number): void;
    writeUnsignedShort(v: number): void;
    writeInt(v: number): void;
    writeUnsignedInt(v: number): void;
    writeFloat(v: number): void;
}

export const createBuffer = (buffer: ArrayBuffer): ByteBuffer => {
    return {
        buffer,
        view: new DataView(buffer),
        offset: 0,

        read(n: number): ArrayBuffer {
            const value = this.buffer.slice(this.offset, this.offset + n);
            this.offset += n;
            return value;
        },

        readByte(): number {
            const value = this.view.getInt8(this.offset);
            this.offset += 1;
            return value;
        },

        readUnsignedByte(): number {
            const value = this.view.getUint8(this.offset);
            this.offset += 1;
            return value;
        },

        readShort(): number {
            const value = this.view.getInt16(this.offset, false);
            this.offset += 2;
            return value;
        },

        readUnsignedShort(): number {
            const value = this.view.getUint16(this.offset, false);
            this.offset += 2;
            return value;
        },

        readInt(): number {
            const value = this.view.getInt32(this.offset, false);
            this.offset += 4;
            return value;
        },

        readUnsignedInt(): number {
            const value = this.view.getUint32(this.offset, false);
            this.offset += 4;
            return value;
        },

        readFloat(): number {
            const value = this.view.getFloat32(this.offset, false);
            this.offset += 4;
            return value;
        },
    };
};

export const createMutableBuffer = (initialSize: number = 0): MutableByteBuffer => {
    return {
        ...createBuffer(new ArrayBuffer(initialSize)),

        ensureCapacity(needed: number): void {
            const newSize = this.offset + needed;
            if (newSize > this.buffer.byteLength) {
                const newBuffer = new ArrayBuffer(newSize);
                new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));

                this.buffer = newBuffer;
                this.view = new DataView(newBuffer);
            }
        },

        write(buf: ArrayBuffer) {
            this.ensureCapacity(buf.byteLength);
            new Uint8Array(this.buffer).set(new Uint8Array(buf), this.offset);
            this.offset += buf.byteLength;
        },

        writeByte(v: number): void {
            this.ensureCapacity(1);
            this.view.setInt8(this.offset, v);
            this.offset += 1;
        },

        writeUnsignedByte(v: number): void {
            this.ensureCapacity(1);
            this.view.setUint8(this.offset, v);
            this.offset += 1;
        },

        writeShort(v: number): void {
            this.ensureCapacity(2);
            this.view.setInt16(this.offset, v, false);
            this.offset += 2;
        },

        writeUnsignedShort(v: number): void {
            this.ensureCapacity(2);
            this.view.setUint16(this.offset, v, false);
            this.offset += 2;
        },

        writeInt(v: number): void {
            this.ensureCapacity(4);
            this.view.setInt32(this.offset, v, false);
            this.offset += 4;
        },

        writeUnsignedInt(v: number) {
            this.ensureCapacity(4);
            this.view.setUint32(this.offset, v, false);
            this.offset += 4;
        },

        writeFloat(v: number): void {
            this.ensureCapacity(4);
            this.view.setFloat32(this.offset, v, false);
            this.offset += 4;
        },
    };
};
