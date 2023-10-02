import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TAR_OBJECT_TYPE_DIRECTORY, TAR_OBJECT_TYPE_FILE, extract } from '../src';

const TAR_URL = 'https://github.com/shaunpersad/streaming-tarball/archive/refs/heads/main.tar.gz';
const STRUCTURE: Array<{ name: string, type: string }> = [
  { name: '/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/.github/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/.github/ISSUE_TEMPLATE/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/.github/ISSUE_TEMPLATE/bug_report.md', type: TAR_OBJECT_TYPE_FILE },
  { name: '/.github/workflows/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/.github/workflows/package.yaml', type: TAR_OBJECT_TYPE_FILE },
  { name: '/.github/workflows/test.yaml', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/src/extract.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/index.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/TarChunker.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/TarExtender.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/TarObject.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/TarParser.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/src/TarPaxParser.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/test/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/test/fixtures/', type: TAR_OBJECT_TYPE_DIRECTORY },
  { name: '/test/fixtures/12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890.txt', type: TAR_OBJECT_TYPE_FILE },
  { name: '/test/extract.test.ts', type: TAR_OBJECT_TYPE_FILE },
  { name: '/.eslintrc.json', type: TAR_OBJECT_TYPE_FILE },
  { name: '/.gitignore', type: TAR_OBJECT_TYPE_FILE },
  { name: '/LICENSE', type: TAR_OBJECT_TYPE_FILE },
  { name: '/package.json', type: TAR_OBJECT_TYPE_FILE },
  { name: '/package-lock.json', type: TAR_OBJECT_TYPE_FILE },
  { name: '/README.md', type: TAR_OBJECT_TYPE_FILE },
  { name: '/tsconfig.eslint.json', type: TAR_OBJECT_TYPE_FILE },
  { name: '/tsconfig.json', type: TAR_OBJECT_TYPE_FILE },
  { name: '/vitest.config.ts', type: TAR_OBJECT_TYPE_FILE },
];

describe('extract', () => {
  it('extracts the file and folder structure', async () => {
    const response = await fetch(TAR_URL);
    const stream = response.body!.pipeThrough(new DecompressionStream('gzip'));

    for await (const obj of extract(stream)) {
      const { type, size } = obj.header;
      const name = obj.header.name.replace('streaming-tarball-main', '');
      expect(STRUCTURE).toContainEqual({ name, type });
      if (name === '/test/extract.test.ts') {
        expect(size).toBeGreaterThan(0);
        await obj.discard();
      } else if (type === TAR_OBJECT_TYPE_FILE) {
        const filePath = path.join(process.cwd(), name);
        const stat = await fs.stat(filePath);
        const text = await fs.readFile(filePath, 'utf-8');
        expect(stat.size).toEqual(size);
        expect(await obj.text()).toEqual(text);
      }
    }
  });
});
