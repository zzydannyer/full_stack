export function createJsonResult(size: number) {
  const items = Array.from({ length: size }, (_, index) => ({
    index,
    name: `record-${index}`,
    active: index % 2 === 0,
    score: (index * 17) % 1000,
  }))
  return {
    count: items.length,
    items,
  }
}

export function createComputeResult(iterations: number) {
  let checksum = 0
  for (let index = 0; index < iterations; index += 1) {
    checksum = (checksum * 1664525 + 1013904223) % 4294967296
  }
  return {
    iterations,
    checksum,
  }
}
