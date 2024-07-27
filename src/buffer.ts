const DEFAULT_BUFFER_SIZE = 1024;
const DEFAULT_RESIZE = 32;

export interface ByteBuffer {
    buffer: ArrayBuffer;
    bufferView: Uint8Array;

    view: DataView;
    offset: number;

    read(n: number): Uint8Array;
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

    write(buf: Uint8Array): void;
    writeByte(v: number): void;
    writeUnsignedByte(v: number): void;
    writeShort(v: number): void;
    writeUnsignedShort(v: number): void;
    writeInt(v: number): void;
    writeUnsignedInt(v: number): void;
    writeFloat(v: number): void;
}

export const createBuffer = (buf: Uint8Array): ByteBuffer => {
    return {
        buffer: buf.buffer,
        bufferView: buf,
        view: new DataView(buf.buffer),
        offset: 0,

        read(n: number): Uint8Array {
            const value = this.bufferView.subarray(this.offset, this.offset + n);
            this.offset += n;
            return value;
        },

        readByte(): number {
            const value = this.view.getInt8(this.bufferView.byteOffset + this.offset);
            this.offset += 1;
            return value;
        },

        readUnsignedByte(): number {
            const value = this.view.getUint8(this.bufferView.byteOffset + this.offset);
            this.offset += 1;
            return value;
        },

        readShort(): number {
            const value = this.view.getInt16(this.bufferView.byteOffset + this.offset, false);
            this.offset += 2;
            return value;
        },

        readUnsignedShort(): number {
            const value = this.view.getUint16(this.bufferView.byteOffset + this.offset, false);
            this.offset += 2;
            return value;
        },

        readInt(): number {
            const value = this.view.getInt32(this.bufferView.byteOffset + this.offset, false);
            this.offset += 4;
            return value;
        },

        readUnsignedInt(): number {
            const value = this.view.getUint32(this.bufferView.byteOffset + this.offset, false);
            this.offset += 4;
            return value;
        },

        readFloat(): number {
            const value = this.view.getFloat32(this.bufferView.byteOffset + this.offset, false);
            this.offset += 4;
            return value;
        },
    };
};

export const createMutableBuffer = (initialSize: number = DEFAULT_BUFFER_SIZE): MutableByteBuffer => {
    return {
        ...createBuffer(new Uint8Array(initialSize)),

        ensureCapacity(needed: number): void {
            if (needed <= 0) {
                return;
            }

            const newSize = this.offset + needed;
            if (newSize > this.buffer.byteLength) {
                // resize buffer and view
                const newBuffer = new ArrayBuffer(newSize + DEFAULT_RESIZE);
                const newBufferView = new Uint8Array(newBuffer, 0, newSize);
                newBufferView.set(this.bufferView);

                this.buffer = newBuffer;
                this.bufferView = newBufferView;
                this.view = new DataView(newBuffer);
            } else {
                // resize only view
                this.bufferView = new Uint8Array(this.buffer, this.bufferView.byteOffset, newSize);
            }
        },

        write(buf: Uint8Array) {
            this.ensureCapacity(buf.length);
            this.bufferView.set(buf, this.offset);
            this.offset += buf.length;
        },

        writeByte(v: number): void {
            this.ensureCapacity(1);
            this.view.setInt8(this.bufferView.byteOffset + this.offset, v);
            this.offset += 1;
        },

        writeUnsignedByte(v: number): void {
            this.ensureCapacity(1);
            this.view.setUint8(this.bufferView.byteOffset + this.offset, v);
            this.offset += 1;
        },

        writeShort(v: number): void {
            this.ensureCapacity(2);
            this.view.setInt16(this.bufferView.byteOffset + this.offset, v, false);
            this.offset += 2;
        },

        writeUnsignedShort(v: number): void {
            this.ensureCapacity(2);
            this.view.setUint16(this.bufferView.byteOffset + this.offset, v, false);
            this.offset += 2;
        },

        writeInt(v: number): void {
            this.ensureCapacity(4);
            this.view.setInt32(this.bufferView.byteOffset + this.offset, v, false);
            this.offset += 4;
        },

        writeUnsignedInt(v: number) {
            this.ensureCapacity(4);
            this.view.setUint32(this.bufferView.byteOffset + this.offset, v, false);
            this.offset += 4;
        },

        writeFloat(v: number): void {
            this.ensureCapacity(4);
            this.view.setFloat32(this.bufferView.byteOffset + this.offset, v, false);
            this.offset += 4;
        },
    };
};
