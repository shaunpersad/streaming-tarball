import TarObject, { TAR_OBJECT_TYPE_FILE, TarObjectHeader } from './TarObject';

/**
 * Converts tar's octal-encoded numbers into decimal.
 */
export function parseOctal(chunk: Uint8Array): number {
  let str = '';
  for (let i = 0; i < chunk.length; i++) {
    str += String.fromCharCode(chunk[i]);
  }
  return parseInt(str, 8) || 0;
}

/**
 * Converts tar's sometimes-nul-terminated byte strings into strings.
 */
export function parseString(chunk: Uint8Array): string {
  const end = chunk.indexOf(0);
  return new TextDecoder().decode(end === -1 ? chunk : chunk.subarray(0, end));
}

/**
 * Checks if the high bit is set, per the GNU extension, which allows for big files:
 *
 * "If a file is over 8GiB, it will set the high bit of the first character in file_size,
 * and the rest of the string is parsed as base 256 (i.e it's treated as a 95-bit integer, big endian)."
 *
 * Left unimplemented mostly out of laziness and lack of need on my part.
 */
export function parseSize(chunk: Uint8Array): number {
  // eslint-disable-next-line no-bitwise
  if (chunk[0] & (1 << 8)) {
    throw new Error('File is too large.');
  }
  return parseOctal(chunk);
}

/**
 * Defaults nul types to files.
 */
export function parseType([byte]: Uint8Array): string {
  return byte ? String.fromCharCode(byte) : TAR_OBJECT_TYPE_FILE;
}

/**
 * Walks through the chunk to parse out what we need.
 */
export function parseHeader(chunk: Uint8Array): TarObjectHeader {
  let index = 0;
  // eslint-disable-next-line no-return-assign
  return {
    name: parseString(chunk.subarray(index, index += 100)),
    mode: chunk.subarray(index, index += 8),
    userId: parseOctal(chunk.subarray(index, index += 8)),
    groupId: parseOctal(chunk.subarray(index, index += 8)),
    size: parseSize(chunk.subarray(index, index += 12)),
    modifiedTime: parseOctal(chunk.subarray(index, index += 12)),
    checksum: chunk.subarray(index, index += 8),
    type: parseType(chunk.subarray(index, index += 1)),
    linkName: parseString(chunk.subarray(index, index += 100)),
    /* UStar */
    magicBytes: parseString(chunk.subarray(index, index += 6)),
    version: chunk.subarray(index, index += 2),
    userName: parseString(chunk.subarray(index, index += 32)),
    groupName: parseString(chunk.subarray(index, index += 32)),
    deviceMajorNumber: chunk.subarray(index, index += 8),
    deviceMinorNumber: chunk.subarray(index, index += 8),
    prefix: parseString(chunk.subarray(index, index += 155)),
    attrs: {},
  };
}

export type TarParserChunk = {
  chunk: Uint8Array,
  isEmpty: boolean,
};

/**
 * Parses each 512-byte chunk as a tar object.
 */
export default class TarParser {
  protected header: TarObjectHeader | null = null;

  protected streamWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;

  protected bytesWritten = 0;

  protected lastHeaderWasEmpty = false;

  protected p = Promise.resolve(); // prevents trying to parse the next obj before the previous was consumed

  parse() {
    return new TransformStream<TarParserChunk, TarObject>({
      transform: async ({ chunk, isEmpty }, controller) => {
        await this.p;
        if (!this.header) {
          if (this.lastHeaderWasEmpty && isEmpty) {
            return;
          }
          this.header = isEmpty ? null : parseHeader(chunk);
          this.lastHeaderWasEmpty = isEmpty;
          if (this.header && !this.header.size) {
            controller.enqueue(new TarObject(this.header));
            this.header = null;
          }
          return;
        }
        if (!this.streamWriter) {
          const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
          this.streamWriter = writable.getWriter();
          controller.enqueue(new TarObject(this.header, readable));
        }
        const { streamWriter } = this;
        const bytesLeft = Math.max(this.header.size - this.bytesWritten, 0);
        if (bytesLeft) {
          this.p = this.p
            .then(() => streamWriter.ready)
            .then(() => streamWriter.write(bytesLeft < 512 ? chunk.subarray(0, bytesLeft) : chunk));
          this.bytesWritten += Math.min(bytesLeft, 512);
        }
        if (this.bytesWritten === this.header.size) {
          this.p = this.p
            .then(() => streamWriter.ready)
            .then(() => streamWriter.close());
          this.header = null;
          this.streamWriter = null;
          this.bytesWritten = 0;
          this.lastHeaderWasEmpty = false;
          // console.log('reset');
        } else {
          // console.log('how did we get here?')
        }
      },
      flush: async () => {
        await this.p;
      },
    });
  }
}
