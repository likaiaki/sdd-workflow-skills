import assert from 'node:assert/strict';
import test from 'node:test';
import { proseMarkdown } from './helpers/markdown-links.mjs';

function targets(source) {
  return [...proseMarkdown(source).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
}

test('resource checks keep real links and exclude fenced and inline code examples', () => {
  const markdown = '[read this](real.md)\n```md\n[sample](./src/ordering/GLOSSARY.md)\n```\n`[literal](example.md)`\n[missing resource](missing.md)';
  assert.deepEqual(targets(markdown), ['real.md', 'missing.md']);
});

test('a short nested fence does not end a longer example block', () => {
  const markdown = '~~~~md\n~~~\n[example](example.md)\n~~~~\n[resource](resource.md)';
  assert.deepEqual(targets(markdown), ['resource.md']);
});
