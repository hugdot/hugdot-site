/** 
 * System Instructions 기반 유물 점수 (RS) 계산기
 */

const MEDIAN_BASE = {
  ATK: 1149,
  HP: 2271,
  DEF: 988
};

const MULTIPLIERS: Record<string, number> = {
  CriticalDamageBase: 1.0,           // 치명타 피해
  BreakDamageAddedRatioBase: 1.0,    // 격파 특수 효과
  CriticalChanceBase: 2.0,           // 치명타 확률
  SpeedBase: 2.5,                    // 속도
  AttackAddedRatio: 1.5,             // 공격력%
  HPAddedRatio: 1.5,                 // HP%
  StatusProbabilityBase: 1.5,        // 효과 명중
  StatusResistanceBase: 1.5,         // 효과 저항
  DefenceAddedRatio: 1.2             // 방어력% (6/5 = 1.2)
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  CriticalDamageBase: 1, CriticalChanceBase: 1, AttackAddedRatio: 1, SpeedBase: 1,
  BreakDamageAddedRatioBase: 0, HPAddedRatio: 0, DefenceAddedRatio: 0, StatusProbabilityBase: 0, StatusResistanceBase: 0
};

export function calculateRelicScore(relic: any, charWeights = DEFAULT_WEIGHTS) {
  let rs = 0;

  relic.substats.forEach((sub: any) => {
    const weight = charWeights[sub.type] ?? 0;
    const multiplier = MULTIPLIERS[sub.type] || 0;
    let statValue = sub.value;

    if (sub.percent) statValue *= 100;

    if (multiplier > 0) {
      rs += statValue * multiplier * weight;
    } else {
      // Flat Stats 변환 (Median Base 사용)
      if (sub.type === 'AttackDelta') {
        rs += (1.5 * (100 * (sub.value / MEDIAN_BASE.ATK))) * (charWeights['AttackAddedRatio'] || 0);
      } else if (sub.type === 'HPDelta') {
        rs += (1.5 * (100 * (sub.value / MEDIAN_BASE.HP))) * (charWeights['HPAddedRatio'] || 0);
      } else if (sub.type === 'DefenceDelta') {
        rs += (1.2 * (100 * (sub.value / MEDIAN_BASE.DEF))) * (charWeights['DefenceAddedRatio'] || 0);
      }
    }
  });

  return parseFloat(rs.toFixed(1));
}

// 에러 해결 포인트: getRank 함수를 export 합니다.
export function getRank(score: number) {
  if (score >= 50) return { label: 'Near Flawless', color: 'text-red-500 font-black' };
  if (score >= 40) return { label: 'Insane', color: 'text-orange-500 font-bold' };
  if (score >= 30) return { label: 'Good', color: 'text-amber-500 font-bold' };
  if (score >= 20) return { label: 'Useable', color: 'text-purple-500' };
  return { label: 'Keep Farming', color: 'text-zinc-500' };
}