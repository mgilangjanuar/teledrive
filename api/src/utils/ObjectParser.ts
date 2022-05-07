import { serializeError } from 'serialize-error'

export function objectParser(obj: unknown): string {
  return JSON.parse(JSON.stringify(serializeError(obj), (key, value) => key.match(/^_/gi) ? undefined : value))
}