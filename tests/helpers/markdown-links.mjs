// Resource validation reads prose links, not example paths inside code fences.
export function proseMarkdown(source) {
  let fence;
  return source.split(/\r?\n/).map((line) => {
    if (fence) {
      const close = new RegExp(`^ {0,3}${fence.character}{${fence.length},}\\s*$`);
      if (close.test(line)) fence = undefined;
      return '';
    }
    const start = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (start) {
      fence = { character: start[1][0], length: start[1].length };
      return '';
    }
    return line.replace(/(`+).*?\1/g, '');
  }).join('\n');
}
