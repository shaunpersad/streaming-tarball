import { TarParserChunk } from './TarParser';

/**
 * Breaks up the stream into chunks of 512 bytes.
 */
export default class TarChunker {
  protected buffer = new Uint8Array(512);

  protected bufferIndex = 0;

  protected bufferIsEmpty = true;

  chunk() {
    return new TransformStream<ArrayBufferView, TarParserChunk>({
      transform: async (view, controller) => {
        const chunk = view instanceof Uint8Array
          ? view
          : new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        let chunkIndex = 0;
        while (this.bufferIndex < 512 && chunkIndex < chunk.length) {
          this.bufferIsEmpty = this.bufferIsEmpty && chunk[chunkIndex] === 0;
          this.buffer[this.bufferIndex++] = chunk[chunkIndex++];
          if (this.bufferIndex === 512) {
            controller.enqueue({ chunk: this.buffer, isEmpty: this.bufferIsEmpty });
            this.buffer = new Uint8Array(512);
            this.bufferIndex = 0;
            this.bufferIsEmpty = true;
          }
        }
      },
    });
  }
}
