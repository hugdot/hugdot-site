/** Preview curve: linear between Lv.1 (first promotion base) and max level (last promotion base + step×(max−1)). */

export function maxCharacterLevel(rarity: number | undefined): number {
  return rarity != null && rarity >= 5 ? 80 : 70
}

export function terminalBaseStat(
  stat: { base: number; step: number } | undefined,
  maxLevel: number
): number {
  if (!stat) return 0
  return stat.base + stat.step * (maxLevel - 1)
}
