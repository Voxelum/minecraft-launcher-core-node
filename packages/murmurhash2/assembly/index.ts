
const m: u32 = (0x5bd1e995)
const r: u32 = (24)
export function murmurHash2(buf: u8[], seed: u32 = 1): u64 {
  let length: u32 = buf.length

  if (length === 0) {
    return 0
  }

  let h: u64 = (seed ^ length)
  let currentIndex: u32 = 0
  while (length >= 4) {
    let k: u64 = (buf[currentIndex++] | (buf[currentIndex++] << 8) | (buf[currentIndex++] << 16) | (buf[currentIndex++] << 24))
    k = k * m
    k ^= k >> r
    k *= m

    h *= m
    h ^= k
    length -= 4
  }
  switch (length) {
    case 3:
      h ^= (buf[currentIndex++] | buf[currentIndex++] << 8)
      h ^= (buf[currentIndex]) << 16
      h *= m
      break
    case 2:
      h ^= (buf[currentIndex++] | buf[currentIndex++] << 8)
      h *= m
      break
    case 1:
      h ^= (buf[currentIndex])
      h *= m
      break
    default:
      break
  }
  h ^= h >> 13
  h *= m
  h ^= h >> 15
  return h
}
