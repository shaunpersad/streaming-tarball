# streaming-tarball
Streaming interface for decoding tarballs on modern JavaScript runtimes.

## Usage
Use the `extract` function to get a readable stream of tar objects. Each object contains a header and a body (if it's a file).
```ts
import { extract } from 'streaming-tarball';

const response = await fetch('https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz');
const stream = response.body.pipeThrough(new DecompressionStream('gzip'));

for await (const obj of extract(stream)) {
  console.log('name:', obj.header.name, 'type:', obj.header.type, 'size:', obj.header.size);
  console.log('text body:', await obj.text());
}
```

The file bodies are streams themselves, so we could've rewritten the above example like this:
```ts
import { extract } from 'streaming-tarball';

const response = await fetch('https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz');
const stream = response.body.pipeThrough(new DecompressionStream('gzip'));

for await (const { header, body } of extract(stream)) {
  console.log('name:', header.name, 'type:', header.type, 'size:', header.size);
  if (body) {
    const subStream = body.pipeThrough(new TextDecoderStream());
    let str = '';
    for await (const chunk of subStream) {
      str += chunk;
    }
    console.log('text body:', str);
  }
}
```

Because file bodies are sub-streams of the parent stream, you must consume them all in order for the parent stream to make progress.
There's a `discard` helper function on the tar object to help you do so:
```ts
import { extract, TAR_OBJECT_TYPE_FILE } from 'streaming-tarball';

const response = await fetch('https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz');
const stream = response.body.pipeThrough(new DecompressionStream('gzip'));

for await (const obj of extract(stream)) {
  if (obj.header.type === TAR_OBJECT_TYPE_FILE && obj.header.size < 100_000) {
    console.log('file found:', obj.header.name, 'body:', await obj.text());
  } else {
    await discard();
  }
}
```
