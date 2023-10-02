export const TAR_PAX_KEY_NAME = 'path' as const;
export const TAR_PAX_KEY_LINK_NAME = 'linkpath' as const;

enum TarPaxParserState {
  ParsingLength,
  ParsingKey,
  ParsingValue,
}

export type TarPaxExtendedHeader = {
  key: string,
  value: string;
};

/**
 * Parses the pax "extended header" key-values.
 *
 * @link https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_01
 */
export default class TarPaxParser {
  protected state = TarPaxParserState.ParsingLength;

  protected lengthStr = '';

  protected length = 0;

  protected key = '';

  protected value = '';

  protected numParsed = 0;

  parse() {
    return new TransformStream<string, TarPaxExtendedHeader>({
      transform: (chunk, controller) => {
        for (const char of chunk) {
          this.numParsed++;
          switch (this.state) {
            case TarPaxParserState.ParsingLength:
              if (this.parseLength(char)) {
                this.state = TarPaxParserState.ParsingKey;
              }
              break;
            case TarPaxParserState.ParsingKey:
              if (this.parseKey(char)) {
                this.state = TarPaxParserState.ParsingValue;
              }
              break;
            case TarPaxParserState.ParsingValue:
              if (this.parseValue(char)) {
                controller.enqueue({ key: this.key, value: this.value });
                this.state = TarPaxParserState.ParsingLength;
                this.lengthStr = '';
                this.length = 0;
                this.key = '';
                this.value = '';
                this.numParsed = 0;
              }
              break;
            default:
              break;
          }
        }
      },
    });
  }

  protected parseLength(char: string) {
    if (char === ' ') {
      this.length = parseInt(this.lengthStr, 10);
      if (Number.isNaN(this.length)) {
        throw new Error(`Could not parse pax extended header length from ${this.lengthStr}`);
      }
      return true;
    }
    this.lengthStr += char;
    return false;
  }

  protected parseKey(char: string) {
    if (char === '=') {
      return true;
    }
    this.key += char;
    return false;
  }

  protected parseValue(char: string) {
    if (this.numParsed === this.length) {
      return true;
    }
    this.value += char;
    return false;
  }
}
