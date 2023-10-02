import TarChunker from './TarChunker';
import TarExtender from './TarExtender';
import TarParser from './TarParser';

/**
 * Returns a readable stream of tar objects. Object bodies are sub-streams.
 */
export default function extract(stream: ReadableStream<ArrayBufferView>) {
  const chunker = new TarChunker();
  const parser = new TarParser();
  const extender = new TarExtender();
  return stream
    .pipeThrough(chunker.chunk())
    .pipeThrough(parser.parse())
    .pipeThrough(extender.extend());
}
