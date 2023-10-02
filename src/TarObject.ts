export const TAR_OBJECT_TYPE_FILE = '0' as const;
export const TAR_OBJECT_TYPE_HARD_LINK = '1' as const;
export const TAR_OBJECT_TYPE_SYM_LINK = '2' as const;
export const TAR_OBJECT_TYPE_CHAR_SPECIAL = '3' as const;
export const TAR_OBJECT_TYPE_BLOCK_SPECIAL = '4' as const;
export const TAR_OBJECT_TYPE_DIRECTORY = '5' as const;
export const TAR_OBJECT_TYPE_FIFO = '6' as const;
export const TAR_OBJECT_TYPE_CONTIGUOUS = '7' as const;
export const TAR_OBJECT_TYPE_PAX_GLOBAL = 'g' as const;
export const TAR_OBJECT_TYPE_PAX_NEXT = 'x' as const;
export const TAR_OBJECT_TYPE_GNU_NEXT_LINK_NAME = 'K' as const;
export const TAR_OBJECT_TYPE_GNU_NEXT_NAME = 'L' as const;

export type TarObjectHeader = {
  name: string,
  mode: Uint8Array,
  userId: number,
  groupId: number,
  size: number,
  modifiedTime: number,
  checksum: Uint8Array,
  type: string,
  linkName: string,
  /* UStar */
  magicBytes: string,
  version: Uint8Array,
  userName: string,
  groupName: string,
  deviceMajorNumber: Uint8Array,
  deviceMinorNumber: Uint8Array,
  prefix: string,
  attrs: Record<string, string>,
};

export default class TarObject {
  readonly header: TarObjectHeader;

  readonly body?: ReadableStream<Uint8Array>;

  constructor(header: TarObjectHeader, body?: ReadableStream<Uint8Array>) {
    this.header = header;
    this.body = body;
  }

  async text() {
    if (!this.body) {
      return null;
    }
    const subStream = this.body.pipeThrough(new TextDecoderStream());
    let str = '';
    for await (const chunk of subStream) {
      str += chunk;
    }
    return str;
  }

  async discard() {
    if (!this.body) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const c of this.body) {
      // spin
    }
  }
}
