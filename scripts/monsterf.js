// scripts/monsterFactory.js
// MonsterConfig + MonsterDrop + MonsterSkillConfig + TextMap
// → src/data/starrail/[lang]/monsters.json + item_drop_sources.json

import fs from 'fs'
import path from 'path'
import https from 'https'
import JSONBigInt from 'json-bigint'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const JSONbig    = JSONBigInt({ useNativeBigInt: true })

const BASE_URL = 'https://gitlab.com/Dimbreath/turnbasedgamedata/-/raw/main'

const languages = {
  kr:'KR', en:'EN', jp:'JP', chs:'CHS', cht:'CHT',
  de:'DE', es:'ES', fr:'FR', id:'ID', pt:'PT',
  ru:'RU', th:'TH', vi:'VI',
}

const DAMAGE_NAMES = {
  kr:  { Physical:'물리', Fire:'화염', Ice:'빙결', Thunder:'번개', Wind:'바람', Quantum:'양자', Imaginary:'허수' },
  en:  { Physical:'Physical', Fire:'Fire', Ice:'Ice', Thunder:'Lightning', Wind:'Wind', Quantum:'Quantum', Imaginary:'Imaginary' },
  jp:  { Physical:'物理', Fire:'炎', Ice:'氷', Thunder:'雷', Wind:'風', Quantum:'量子', Imaginary:'虚数' },
  chs: { Physical:'物理', Fire:'火', Ice:'冰', Thunder:'雷', Wind:'风', Quantum:'量子', Imaginary:'虚数' },
  cht: { Physical:'物理', Fire:'火', Ice:'冰', Thunder:'雷', Wind:'風', Quantum:'量子', Imaginary:'虛數' },
  de:  { Physical:'Physisch', Fire:'Feuer', Ice:'Eis', Thunder:'Blitz', Wind:'Wind', Quantum:'Quanten', Imaginary:'Imaginär' },
  es:  { Physical:'Físico', Fire:'Fuego', Ice:'Hielo', Thunder:'Rayo', Wind:'Viento', Quantum:'Cuántico', Imaginary:'Imaginario' },
  fr:  { Physical:'Physique', Fire:'Feu', Ice:'Glace', Thunder:'Foudre', Wind:'Vent', Quantum:'Quantique', Imaginary:'Imaginaire' },
  id:  { Physical:'Fisik', Fire:'Api', Ice:'Es', Thunder:'Petir', Wind:'Angin', Quantum:'Kuantum', Imaginary:'Imajiner' },
  pt:  { Physical:'Físico', Fire:'Fogo', Ice:'Gelo', Thunder:'Relâmpago', Wind:'Vento', Quantum:'Quântico', Imaginary:'Imaginário' },
  ru:  { Physical:'Физический', Fire:'Огонь', Ice:'Лёд', Thunder:'Молния', Wind:'Ветер', Quantum:'Квантовый', Imaginary:'Воображаемый' },
  th:  { Physical:'กายภาพ', Fire:'ไฟ', Ice:'น้ำแข็ง', Thunder:'สายฟ้า', Wind:'ลม', Quantum:'ควอนตัม', Imaginary:'จินตนาการ' },
  vi:  { Physical:'Vật lý', Fire:'Lửa', Ice:'Băng', Thunder:'Sấm sét', Wind:'Gió', Quantum:'Lượng tử', Imaginary:'Ảo' },
  cn:  { Physical:'物理', Fire:'火', Ice:'冰', Thunder:'雷', Wind:'风', Quantum:'量子', Imaginary:'虚数' },
}

const ELITE_MAP = { 1:'Normal', 2:'Elite', 3:'Boss' }

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = (t) => https.get(t, { headers:{ 'User-Agent':'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return req(res.headers.location)
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${t}`))
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b))
    }).on('error', reject)
    req(url)
  })
}

function cleanTxt(str) {
  if (!str) return ''
  return str
    .replace(/\{RUBY_B#[^}]*\}([^{]*)\{RUBY_E#\}/g, '$1')
    .replace(/\{[^}]*\}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/#(\d+)/g, '$1')
    .replace(/\\n/g, '\n')
    .trim()
}

async function run() {
  console.log('🚀 [몬스터 팩토리] 시작...')

  // ── 1. MonsterConfig (JSONbig으로 파싱) ──
  console.log('⏳ MonsterConfig.json 로드...')
  const monsterConfigList = JSONbig.parse(await fetchText(`${BASE_URL}/ExcelOutput/MonsterConfig.json`))

  const configMap = {}
  for (const m of monsterConfigList) {
    const tid = Number(m.MonsterTemplateID)
    if (!configMap[tid]) configMap[tid] = m
  }
  console.log(`✅ MonsterConfig: ${Object.keys(configMap).length}개 템플릿`)

  // ── 2. MonsterDrop ──
  console.log('⏳ MonsterDrop.json 로드...')
  const dropList = JSON.parse(await fetchText(`${BASE_URL}/ExcelOutput/MonsterDrop.json`))

  const dropMap = {}
  for (const d of dropList) {
    const tid = d.MonsterTemplateID
    if (!dropMap[tid]) {
      dropMap[tid] = {
        exp:   d.AvatarExpReward ?? 0,
        items: (d.DisplayItemList ?? []).map(i => String(i.ItemID)),
      }
    }
  }
  console.log(`✅ MonsterDrop: ${Object.keys(dropMap).length}개`)

  // ── 3. MonsterSkillConfig (JSONbig으로 파싱) ──
  console.log('⏳ MonsterSkillConfig.json 로드...')
  const skillList = JSONbig.parse(await fetchText(`${BASE_URL}/ExcelOutput/MonsterSkillConfig.json`))

  const skillHashMap = {}
  for (const sk of skillList) {
    const sid = Number(sk.SkillID)
    skillHashMap[sid] = {
      nameHash:   sk.SkillName?.Hash?.toString() ?? '',
      descHash:   sk.SkillDesc?.Hash?.toString() ?? '',
      damageType: sk.DamageType ?? '',
    }
  }
  console.log(`✅ MonsterSkillConfig: ${Object.keys(skillHashMap).length}개`)

  // ── 4. 파밍 가능 몬스터 ID 필터 ──
  const FARMABLE_TYPES = ['CommonMonsterDrop', 'WeeklyMonsterDrop', 'AvatarRank', 'Material', 'ComposeMaterial', 'TracePath']
  const krItems = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/starrail/kr/items.json'), 'utf-8'))

  const farmableIds = new Set()
  for (const [tid, drop] of Object.entries(dropMap)) {
    const hasFarmable = drop.items.some(id => {
      const item = krItems[id]
      return item && FARMABLE_TYPES.includes(item.sub_type)
    })
    if (hasFarmable) farmableIds.add(String(tid))
  }
  console.log(`✅ 파밍 가능 몬스터: ${farmableIds.size}개`)

  // ── 5. 유효 몬스터 필터링 ──
  const validConfigs = Object.values(configMap).filter(m => m.MonsterName?.Hash && m.EliteGroup && farmableIds.has(String(Number(m.MonsterTemplateID))))
  console.log(`✅ 유효 몬스터: ${validConfigs.length}개`)

  // ── 6. 언어별 처리 ──
  for (const [folderName, mapCode] of Object.entries(languages)) {
    console.log(`\n📂 [${folderName.toUpperCase()}] 처리 시작...`)

    const textMap = {}
    for (const fileName of [
      `TextMap${mapCode}.json`,
      `TextMapMain${mapCode}.json`,
      `TextMap${mapCode}_0.json`,
      `TextMap${mapCode}_1.json`,
    ]) {
      try {
        const raw = await fetchText(`${BASE_URL}/TextMap/${fileName}`)
        Object.assign(textMap, JSON.parse(raw))
        console.log(`   ✅ ${fileName}`)
      } catch { /* 없는 파일 무시 */ }
    }

    if (!Object.keys(textMap).length) {
      console.error(`   ❌ 텍스트맵 없음`); continue
    }

    const dmgNames = DAMAGE_NAMES[folderName] ?? DAMAGE_NAMES['en']
    const result = {}

    for (const m of validConfigs) {
      const tid      = String(Number(m.MonsterTemplateID))
      const nameHash = m.MonsterName?.Hash?.toString() ?? ''
      const name     = cleanTxt(textMap[nameHash] ?? '')
      if (!name) continue

      const introHash = m.MonsterIntroduction?.Hash?.toString() ?? ''
      const intro     = cleanTxt(textMap[introHash] ?? '')
      const grade     = ELITE_MAP[Number(m.EliteGroup)] ?? 'Normal'
      const drop      = dropMap[Number(m.MonsterTemplateID)]

      // 약점
      const weaknesses = (m.StanceWeakList ?? []).map(w => ({
        key:  w,
        name: dmgNames[w] ?? w,
        icon: `/starrail/assets/icon/element/${w}.webp`,
      }))

      // 저항
      const resistances = (m.DamageTypeResistance ?? []).map(r => ({
        key:   r.DamageType,
        name:  dmgNames[r.DamageType] ?? r.DamageType,
        value: Math.round((r.Value?.Value ?? 0) * 100),
      }))

      // 상태이상 면역
      const debuffResists = (m.DebuffResist ?? [])
        .filter(d => d.Value?.Value >= 1)
        .map(d => d.Key)

      // 스킬
      const skills = (m.SkillList ?? [])
        .map(sid => {
          const sk = skillHashMap[Number(sid)]
          if (!sk) return null
          const skName = cleanTxt(textMap[sk.nameHash] ?? '')
          const skDesc = cleanTxt(textMap[sk.descHash] ?? '')
          return { id: String(Number(sid)), name: skName, desc: skDesc, damage_type: sk.damageType }
        })
        .filter(Boolean)

      result[tid] = {
        id: tid,
        name,
        intro,
        grade,
        weaknesses,
        resistances,
        debuff_resists: debuffResists,
        exp:        drop?.exp ?? 0,
        drop_items: drop?.items ?? [],
        skills,
      }
    }

    const outDir = path.join(__dirname, `../src/data/starrail/${folderName}`)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'monsters.json'), JSON.stringify(result, null, 2))
    console.log(`   🎉 ${folderName.toUpperCase()} 완료 (${Object.keys(result).length}개)`)

    for (const k in textMap) delete textMap[k]
  }

  // ── 6. 아이템 역방향 드랍 맵 ──
  console.log('\n📊 item_drop_sources.json 생성...')
  const krMonsters = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/data/starrail/kr/monsters.json'), 'utf-8')
  )

  const itemDropMap = {}
  for (const [mid, m] of Object.entries(krMonsters)) {
    for (const itemId of m.drop_items) {
      if (!itemDropMap[itemId]) itemDropMap[itemId] = []
      itemDropMap[itemId].push({ id: mid, name: m.name, grade: m.grade })
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '../src/data/starrail/item_drop_sources.json'),
    JSON.stringify(itemDropMap, null, 2)
  )
  console.log(`✅ item_drop_sources.json (${Object.keys(itemDropMap).length}개 아이템)`)

  console.log('\n🏁 완료!')
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })