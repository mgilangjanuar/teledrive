export const markdownSafe = (str: string): string => str
  .replaceAll('_', '\\_')
  .replaceAll('*', '\\*')
  .replaceAll('[', '\\[')
  .replaceAll('`', '\\`')