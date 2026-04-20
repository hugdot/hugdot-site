import fs from 'fs';
import path from 'path';
import https from 'https';
import JSONBigInt from 'json-bigint';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSONbig = JSONBigInt({ useNativeBigInt: true });

const languages = {
  kr: 'KR', en: 'EN', jp: 'JP', chs: 'CHS', cht: 'CHT',
  de: 'DE', es: 'ES', fr: 'FR', id: 'ID', pt: 'PT',
  ru: 'RU', th: 'TH', vi: 'VI',
};

const BASE_URL = 'https://gitlab.com/Dimbreath/turnbasedgamedata/-/raw/main';

// 업적 카테고리 이름 (13개국어 완전 현지화)
const SERIES_NAMES = {
  kr:  { '1': '육성',           '2': '수집',       '3': '메인 스토리',        '4': '탐험',         '5': '동행',            '6': '도전',            '7': '전투',      '8': '개척',         '9': '모의 우주'              },
  en:  { '1': 'Trailblaze',     '2': 'Collect',    '3': 'Trailblaze Story',   '4': 'Explore',      '5': 'Companion',       '6': 'Challenge',       '7': 'Battle',    '8': 'The Rail',     '9': 'Simulated Universe'    },
  jp:  { '1': '育成',           '2': '収集',       '3': 'メインストーリー',    '4': '探索',         '5': '同行',            '6': '挑戦',            '7': '戦闘',      '8': '開拓',         '9': '模擬宇宙'               },
  chs: { '1': '培养',           '2': '收集',       '3': '主线',               '4': '探索',         '5': '伙伴',            '6': '挑战',            '7': '战斗',      '8': '开拓',         '9': '模拟宇宙'               },
  cht: { '1': '培養',           '2': '收集',       '3': '主線',               '4': '探索',         '5': '夥伴',            '6': '挑戰',            '7': '戰鬥',      '8': '開拓',         '9': '模擬宇宙'               },
  de:  { '1': 'Training',       '2': 'Sammeln',    '3': 'Hauptstory',         '4': 'Erkunden',     '5': 'Begleiter',       '6': 'Herausforderung', '7': 'Kampf',     '8': 'Pfadfinder',   '9': 'Simul. Universum'      },
  es:  { '1': 'Desarrollo',     '2': 'Colección',  '3': 'Historia principal', '4': 'Exploración',  '5': 'Compañero',       '6': 'Desafío',         '7': 'Combate',   '8': 'Pionero',      '9': 'Universo Simulado'     },
  fr:  { '1': 'Développement',  '2': 'Collection', '3': 'Histoire principale','4': 'Exploration',  '5': 'Compagnon',       '6': 'Défi',            '7': 'Combat',    '8': 'Pionniers',    '9': 'Univers Simulé'        },
  id:  { '1': 'Pengembangan',   '2': 'Koleksi',    '3': 'Cerita Utama',       '4': 'Eksplorasi',   '5': 'Pendamping',      '6': 'Tantangan',       '7': 'Pertempuran','8': 'Pionir',      '9': 'Alam Semesta Simulasi' },
  pt:  { '1': 'Desenvolvimento', '2': 'Coleção',   '3': 'História Principal', '4': 'Exploração',   '5': 'Companheiro',     '6': 'Desafio',         '7': 'Combate',   '8': 'Pioneiro',     '9': 'Universo Simulado'     },
  ru:  { '1': 'Развитие',       '2': 'Коллекция', '3': 'Основной сюжет',     '4': 'Исследование', '5': 'Компаньон',       '6': 'Испытание',       '7': 'Бой',       '8': 'Первопроходец','9': 'Симул. вселенная'      },
  th:  { '1': 'พัฒนา',          '2': 'สะสม',      '3': 'เนื้อเรื่องหลัก',    '4': 'สำรวจ',       '5': 'เพื่อนร่วมทาง',   '6': 'ความท้าทาย',     '7': 'ต่อสู้',    '8': 'บุกเบิก',      '9': 'จักรวาลจำลอง'         },
  vi:  { '1': 'Phát triển',     '2': 'Sưu tập',   '3': 'Cốt truyện chính',   '4': 'Khám phá',    '5': 'Đồng hành',       '6': 'Thách thức',      '7': 'Chiến đấu', '8': 'Khai phá',     '9': 'Vũ trụ mô phỏng'      },
};

const RARITY_POINTS = { High: 3, Mid: 2, Low: 1 };

async function fetchWithRedirect(url) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${targetUrl}`));
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      }).on('error', reject);
    };
    request(url);
  });
}

function cleanTxt(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g,'')
    .replace(/\[\w+\]/g,'')
    .replace(/#(\d+)/g,'$1')
    .replace(/\\n/g,'\n')
    .trim();
}

async function startAchievementFactory() {
  console.log('🚀 [업적 공장] 모든 언어 통합 가공 시작...');

  // 1. 기초 업적 데이터 로드
  console.log('⏳ AchievementData.json 로드 중...');
  const rawAchData = await fetchWithRedirect(`${BASE_URL}/ExcelOutput/AchievementData.json`);
  const achList = JSONbig.parse(rawAchData);
  console.log(`✅ 기본 데이터 확보 (총 ${achList.length}개)`);

  // 2. 각 언어별 가공 루프
  for (const [folderName, mapCode] of Object.entries(languages)) {
    console.log(`\n📂 [${folderName.toUpperCase()}] 처리 시작...`);

    const integratedMap = {};

    const possibleFiles = [
      `TextMap${mapCode}.json`,
      `TextMapMain${mapCode}.json`,
      `TextMap${mapCode}_0.json`,
      `TextMap${mapCode}_1.json`,
      `TextMap${mapCode}_2.json`,
    ];

    for (const fileName of possibleFiles) {
      try {
        const fileUrl = `${BASE_URL}/TextMap/${fileName}`;
        const rawContent = await fetchWithRedirect(fileUrl);
        const data = JSON.parse(rawContent);
        Object.assign(integratedMap, data);
        console.log(`   - ✅ ${fileName} 병합 완료`);
      } catch (err) {
        // 없는 파일은 무시
      }
    }

    if (Object.keys(integratedMap).length === 0) {
      console.error(`   - ❌ [${folderName}] 텍스트맵 데이터를 하나도 찾지 못했습니다.`);
      continue;
    }

    const result = {};
    const seriesNames = SERIES_NAMES[folderName] ?? SERIES_NAMES['en'];

    achList.forEach((item) => {
      const id       = item.AchievementID.toString();
      const seriesId = item.SeriesID.toString();

      const titleHash = item.AchievementTitle?.Hash?.toString();
      const descHash  = item.AchievementDesc?.Hash?.toString();
      const hideHash  = item.ShowAfterFinishDesc?.Hash?.toString();

      result[id] = {
        id,
        series_id:   seriesId,
        series_name: seriesNames[seriesId] ?? (SERIES_NAMES['en'][seriesId] ?? `Series ${seriesId}`),
        title:       cleanTxt(integratedMap[titleHash]),
        desc:        cleanTxt(integratedMap[descHash]),
        hide_desc:   cleanTxt(integratedMap[hideHash]),
        hide:        item.ShowType === 'ShowAfterFinish',
        rarity:      item.Rarity   ?? 'Low',
        points:      RARITY_POINTS[item.Rarity] ?? 1,
        priority:    item.Priority ?? 0,
      };
    });

    const outputDir = path.join(__dirname, `../src/data/starrail/${folderName}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(
      path.join(outputDir, 'achievements.json'),
      JSON.stringify(result, null, 2),
    );

    console.log(`   - 🎉 ${folderName.toUpperCase()} 저장 완료 (${Object.keys(result).length}개)`);

    // 메모리 해제
    for (const key in integratedMap) delete integratedMap[key];
  }

  console.log('\n🏁 모든 공정 완료!');
}

startAchievementFactory().catch((e) => {
  console.error('❌ 치명적 오류:', e);
  process.exit(1);
});