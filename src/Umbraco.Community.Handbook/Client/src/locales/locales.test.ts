import { expect, it } from 'vitest';
import { messages,keys } from './manifests';
it('provides every UI string in all nine languages', () => {
  expect(Object.keys(messages)).toHaveLength(9);
  for (const values of Object.values(messages)) {
    expect(values).toHaveLength(keys.length);
    expect(values.every(v=>v.trim().length > 0)).toBe(true);
  }
});
