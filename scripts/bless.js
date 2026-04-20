// scripts/simulatedBlessingFactory.js
// RogueBuff.json (IsShow있는 항목 → path 정보)
// + RogueMazeBuff.json (ID = MazeBuffID → 이름/설명 해시 + 아이콘)
// + TextMap → simulated_blessings.json 완전 재생성

import fs from 'fs'
import path from 'path'
import https from 'https'
import JSONBigInt from 'json-bigint'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const JSONbig = JSONBigInt({ useNativeBigInt: true })

const BASE_URL = 'https://gitlab.com/Dimbreath/turnbasedgamedata/-/raw/main'

const languages = {
  kr: 'KR',
  en: 'EN',
  jp: 'JP',
  chs: 'CHS',
  cht: 'CHT',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  id: 'ID',
  pt: 'PT',
  ru: 'RU',
  th: 'TH',
  vi: 'VI',
}

const BUFF_TYPE_PATH = {
  100: 'All',
  120: 'Preservation',
  121: 'Remembrance',
  122: 'Nihility',
  123: 'Abundance',
  124: 'Hunt',
  125: 'Destruction',
  126: 'Elation',
  127: 'Propagation',
  128: 'Erudition',
}

const PATH_NAMES = {
  All: {
    kr: '공통',
    en: 'All',
    jp: '共通',
    chs: '通用',
    cht: '通用',
    de: 'Alle',
    es: 'Todos',
    fr: 'Tous',
    id: 'Semua',
    pt: 'Todos',
    ru: 'Общий',
    th: 'ทั้งหมด',
    vi: 'Tất cả',
  },
  Preservation: {
    kr: '보존',
    en: 'Preservation',
    jp: '存護',
    chs: '存护',
    cht: '存護',
    de: 'Bewahrung',
    es: 'Preservación',
    fr: 'Préservation',
    id: 'Pelestarian',
    pt: 'Preservação',
    ru: 'Сохранение',
    th: 'การอนุรักษ์',
    vi: 'Bảo tồn',
  },
  Remembrance: {
    kr: '기억',
    en: 'Remembrance',
    jp: '記憶',
    chs: '记忆',
    cht: '記憶',
    de: 'Erinnerung',
    es: 'Reminiscencia',
    fr: 'Souvenir',
    id: 'Kenangan',
    pt: 'Lembrança',
    ru: 'Воспоминание',
    th: 'ความทรงจำ',
    vi: 'Hồi tưởng',
  },
  Nihility: {
    kr: '공허',
    en: 'Nihility',
    jp: '虚無',
    chs: '虚无',
    cht: '虛無',
    de: 'Nihilismus',
    es: 'Nihilidad',
    fr: 'Nihilité',
    id: 'Nihilitas',
    pt: 'Niilidade',
    ru: 'Нигилизм',
    th: 'ความว่างเปล่า',
    vi: 'Hư vô',
  },
  Abundance: {
    kr: '풍요',
    en: 'Abundance',
    jp: '豊穣',
    chs: '丰饶',
    cht: '豐饒',
    de: 'Überfluss',
    es: 'Abundancia',
    fr: 'Abondance',
    id: 'Kelimpahan',
    pt: 'Abundância',
    ru: 'Изобилие',
    th: 'ความอุดมสมบูรณ์',
    vi: 'Phong phú',
  },
  Hunt: {
    kr: '수렵',
    en: 'The Hunt',
    jp: '巡猟',
    chs: '巡猎',
    cht: '巡獵',
    de: 'Die Jagd',
    es: 'La Caza',
    fr: 'La Chasse',
    id: 'Perburuan',
    pt: 'A Caça',
    ru: 'Охота',
    th: 'การล่า',
    vi: 'Săน bắt',
  },
  Destruction: {
    kr: '파멸',
    en: 'Destruction',
    jp: '壊滅',
    chs: '毁灭',
    cht: '毀滅',
    de: 'Zerstörung',
    es: 'Destrucción',
    fr: 'Destruction',
    id: 'Kehancuran',
    pt: 'Destruição',
    ru: 'Разрушение',
    th: 'การทำลาย',
    vi: 'Hủy diệt',
  },
  Elation: {
    kr: '환락',
    en: 'Elation',
    jp: '歓楽',
    chs: '欢愉',
    cht: '歡愉',
    de: 'Heiterkeit',
    es: 'Euforia',
    fr: 'Allégresse',
    id: 'Kegembiraan',
    pt: 'Alegria',
    ru: 'Радость',
    th: 'ความยินดี',
    vi: 'Hân hoan',
  },
  Propagation: {
    kr: '번식',
    en: 'Propagation',
    jp: '繁殖',
    chs: '繁育',
    cht: '繁育',
    de: 'Vermehrung',
    es: 'Propagación',
    fr: 'Propagation',
    id: 'Perbanyakan',
    pt: 'Propagação',
    ru: 'Размножение',
    th: 'การขยายพันธุ์',
    vi: 'Sinh sôi',
  },
  Erudition: {
    kr: '지식',
    en: 'Erudition',
    jp: '智識',
    chs: '智识',
    cht: '智識',
    de: 'Gelehrsamkeit',
    es: 'Erudición',
    fr: 'Érudition',
    id: 'Erudisi',
    pt: 'Erudição',
    ru: 'Эрудиция',
    th: 'ความรอบรู้',
    vi: 'Uyên bác',
  },
}

const toAssetUrl = (rel) => {
  if (!rel) return ''
  return `/starrail/assets/${rel.replace(/^\//, '').replace(/^starrail\/assets\//, '')}`
}

async function fetchWithRedirect(url) {
  return new Promise((resolve, reject) => {
    const req = (t) =>
      https
        .get(t, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return req(res.headers.location)
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${t}`))
          let b = ''
          res.on('data', (c) => (b += c))
          res.on('end', () => resolve(b))
        })
        .on('error', reject)
    req(url)
  })
}

function cleanTxt(str) {
  if (!str) return '';
  return str
    .replace(/\{RUBY_B#[^}]*\}([^{]*)\{RUBY_E#\}/g, '$1')  // 루비 문자 처리
    .replace(/\{[^}]*\}/g, '')                               // 나머지 {} 태그 제거
    .replace(/<[^>]*>/g,'')
    .replace(/\[\w+\]/g,'')
    .replace(/#(\d+)/g,'$1')
    .replace(/\\n/g,'\n')
    .trim();
}

async function run() {
  console.log('🚀 [블레싱 공장] RogueMazeBuff 기반 재생성 시작...')

  // ── 1. RogueBuff.json: IsShow 있는 항목 → path 정보 맵 ──
  console.log('⏳ RogueBuff.json 로드 중...')
  const rogueRaw = await fetchWithRedirect(`${BASE_URL}/ExcelOutput/RogueBuff.json`)
  const rogueList = JSONbig.parse(rogueRaw)

  // MazeBuffID → { rogueBuffType, category, aeonId }
  const rogueMap = {}
  for (const item of rogueList) {
    const id = item.MazeBuffID?.toString()
    if (!id || item.IsShow === undefined) continue
    rogueMap[id] = {
      rogueBuffType: Number(item.RogueBuffType ?? 100),
      category: item.RogueBuffCategory ?? 'Common',
      aeonId: Number(item.AeonID ?? 0),
    }
  }
  console.log(`✅ RogueBuff 블레싱 후보: ${Object.keys(rogueMap).length}개`)

  // ── 2. RogueMazeBuff.json: ID → 이름/설명 해시 + 아이콘 맵 ──
  console.log('⏳ RogueMazeBuff.json 로드 중...')
  const mazeBufRaw = await fetchWithRedirect(`${BASE_URL}/ExcelOutput/RogueMazeBuff.json`)
  const mazeBufList = JSONbig.parse(mazeBufRaw)

  // ID → { nameHash, descHash, simpleDescHash, icon }
  // LvMax>1인 경우 Lv:1 항목만 사용 (중복 제거)
  const mazeMap = {}
  for (const item of mazeBufList) {
    const id = item.ID?.toString()
    if (!id) continue
    // Lv:1 항목 우선, 이미 있으면 스킵
    if (mazeMap[id] && item.Lv !== 1) continue
    mazeMap[id] = {
      nameHash: item.BuffName?.Hash?.toString() ?? '',
      descHash: item.BuffDesc?.Hash?.toString() ?? '',
      simpleDescHash: item.BuffSimpleDesc?.Hash?.toString() ?? '',
      enhancedHash: item.BuffDescBattle?.Hash?.toString() ?? '',
      icon: item.BuffIcon ?? '',
    }
  }
  console.log(`✅ RogueMazeBuff 해시맵: ${Object.keys(mazeMap).length}개`)

  // ── 교차 확인 ──
  const validIds = Object.keys(rogueMap).filter((id) => mazeMap[id])
  console.log(`✅ 교차 매핑: ${validIds.length}개`)

  if (validIds.length === 0) {
    console.error('❌ 교차 0개 — ID 샘플 확인:')
    console.log('RogueMap:', Object.keys(rogueMap).slice(0, 5))
    console.log('MazeMap:', Object.keys(mazeMap).slice(0, 5))
    process.exit(1)
  }

  // ── 3. 언어별 처리 ──
  for (const [folderName, mapCode] of Object.entries(languages)) {
    console.log(`\n📂 [${folderName.toUpperCase()}] 처리 시작...`)

    const textMap = {}
    for (const fileName of [
      `TextMap${mapCode}.json`,
      `TextMapMain${mapCode}.json`,
      `TextMap${mapCode}_0.json`,
      `TextMap${mapCode}_1.json`,
      `TextMap${mapCode}_2.json`,
    ]) {
      try {
        const raw = await fetchWithRedirect(`${BASE_URL}/TextMap/${fileName}`)
        Object.assign(textMap, JSON.parse(raw))
        console.log(`   - ✅ ${fileName}`)
      } catch {
        /* 없는 파일 무시 */
      }
    }

    if (!Object.keys(textMap).length) {
      console.error(`   - ❌ 텍스트맵 없음`)
      continue
    }

    // kr 첫 번째 샘플 확인
    if (folderName === 'kr') {
      const sampleId = validIds[0]
      const h = mazeMap[sampleId]
      console.log(`   샘플 [${sampleId}]:`)
      console.log(`   - name: ${cleanTxt(textMap[h.nameHash])}`)
      console.log(`   - desc: ${cleanTxt(textMap[h.descHash])?.slice(0, 60)}...`)
    }

    const result = {}
    const lk = folderName === 'chs' ? 'chs' : folderName

    for (const id of validIds) {
      const meta = rogueMap[id]
      const hashes = mazeMap[id]

      const name = cleanTxt(textMap[hashes.nameHash])
      const desc = cleanTxt(textMap[hashes.descHash])
      const simpleDesc = cleanTxt(textMap[hashes.simpleDescHash])
      const enhancedDesc = cleanTxt(textMap[hashes.enhancedHash])

      if (!name) continue

      const pathKey = BUFF_TYPE_PATH[meta.rogueBuffType] ?? 'All'
      const pathName = PATH_NAMES[pathKey]?.[lk] ?? PATH_NAMES[pathKey]?.en ?? pathKey

      result[id] = {
        id,
        name,
        desc,
        simple_desc: simpleDesc,
        enhanced_desc: enhancedDesc && enhancedDesc !== desc ? enhancedDesc : '',
        icon: toAssetUrl(hashes.icon),
        path_type: meta.rogueBuffType,
        path_key: pathKey,
        path_name: pathName,
        category: meta.category,
        aeon_id: meta.aeonId,
      }
    }

    const outDir = path.join(__dirname, `../src/data/starrail/${folderName}`)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'simulated_blessings.json'), JSON.stringify(result, null, 2))
    console.log(`   - 🎉 ${folderName.toUpperCase()} 완료 (${Object.keys(result).length}개)`)

    for (const k in textMap) delete textMap[k]
  }

  console.log('\n🏁 완료!')
}

run().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
