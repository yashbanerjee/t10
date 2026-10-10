const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];

export function sizeRank(size: string) {
  const index = SIZE_ORDER.indexOf(size.trim().toUpperCase());
  return index === -1 ? SIZE_ORDER.length : index;
}

export function bySize<T extends { size: string }>(left: T, right: T) {
  return sizeRank(left.size) - sizeRank(right.size) || left.size.localeCompare(right.size);
}
