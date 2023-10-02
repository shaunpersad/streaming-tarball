# streaming-tarball
Streaming interface for decoding tarballs on modern JavaScript runtimes (Cloudflare Workers, Deno, etc.).

## Features
- Extract tarballs of any size with no filesystem usage and low memory usage.
- Handles many of the tar extensions (ustar, pax, gnu) to enable long file names, attributes, etc.
- Works anywhere WebStreams are supported.

## Installation
```shell
npm install streaming-tarball
```

## Usage
Use the `extract` function to get a readable stream of tar objects. Each object contains a header and a body (if it's a file).
You can get the full body of the file as text by calling `obj.text()`.
```ts
import { extract } from 'streaming-tarball';

const response = await fetch('https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz');
const stream = response.body.pipeThrough(new DecompressionStream('gzip'));

for await (const obj of extract(stream)) {
  console.log(
    'name:', obj.header.name, 
    'type:', obj.header.type, 
    'size:', obj.header.size,
  );
  console.log('text body:', await obj.text());
}
```

The file bodies are actually binary streams, so we could've rewritten the above example using the `obj.body` stream like this:
```ts
import { extract } from 'streaming-tarball';

const response = await fetch('https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz');
const stream = response.body.pipeThrough(new DecompressionStream('gzip'));

for await (const { header, body } of extract(stream)) {
  console.log(
    'name:', header.name, 
    'type:', header.type, 
    'size:', header.size,
  );
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
There's a `discard` helper function on the tar object to help you do that when you aren't otherwise using the body:
```ts
import { extract, TAR_OBJECT_TYPE_FILE } from 'streaming-tarball';

const response = await fetch('https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz');
const stream = response.body.pipeThrough(new DecompressionStream('gzip'));

for await (const obj of extract(stream)) {
  if (obj.header.type === TAR_OBJECT_TYPE_FILE && obj.header.size < 100_000) {
    console.log(
      'file found:', obj.header.name, 
      'text body:', await obj.text(),
    );
  } else {
    await obj.discard(); // consumes the unused body
  }
}
```

There are many other tar object types, which you can determine by comparing `obj.header.type` to the appropriate string value,
which are conveniently exported for you:
```ts
import {
  TAR_OBJECT_TYPE_BLOCK_SPECIAL,
  TAR_OBJECT_TYPE_CHAR_SPECIAL,
  TAR_OBJECT_TYPE_CONTIGUOUS,
  TAR_OBJECT_TYPE_DIRECTORY,
  TAR_OBJECT_TYPE_FIFO,
  TAR_OBJECT_TYPE_FILE,
  TAR_OBJECT_TYPE_GNU_NEXT_LINK_NAME,
  TAR_OBJECT_TYPE_GNU_NEXT_NAME,
  TAR_OBJECT_TYPE_HARD_LINK,
  TAR_OBJECT_TYPE_PAX_GLOBAL,
  TAR_OBJECT_TYPE_PAX_NEXT,
  TAR_OBJECT_TYPE_SYM_LINK,
} from 'streaming-tarball';
```
Note however that you will never see the `_GNU_` or `_PAX_` object types in practice, because they are consumed and applied to the objects they are targeting.
