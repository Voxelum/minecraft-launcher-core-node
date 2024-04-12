import { describe, expect, test } from 'vitest';
import { murmurHash2 } from "../build/debug.js";

describe('murmurHash2', () => {
  test('should calculate murmurHash2', async ({ }) => {
    expect(murmurHash2([1, 2, 3], 1)).toEqual(123)
  })
})
