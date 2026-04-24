import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const languages = {
  'ko': 'kr', 'en': 'en', 'ja': 'jp', 'zh-Hans': 'chs', 'zh-Hant': 'cht',
  'de': 'de', 'es': 'es', 'fr': 'fr', 'id': 'id', 'pt': 'pt', 'ru': 'ru', 'th': 'th', 'vi': 'vi'
};

const RAW_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/ConfigDB';
const TEXT_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/TextMap';

// 오직 속성 데이터만 처리 (중복 방지)
const TABLES = {
  elements: 'ElementInfo.json'
};

const TEXT_FILES = ['MultiText.json', 'TidText.json', 'MultiText_1sthalf.json', 'MultiText_2ndhalf.json'];

async function fetchJSON(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

const clean = (str) => str ? str.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n').trim() : "";

async function startElementFactory() {
  console.log('🌈 [속성 전용 공정] elements.json 생성 시작...');

  const rawElements = await fetchJSON(`${RAW_URL}/${TABLES.elements}`) || [];
  console.log(` ✅ 원본 속성 데이터 로드 완료 (${rawElements.length}개)`);

  for (const [repoLang, localLang] of Object.entries(languages)) {
    console.log(`\n🌎 [${localLang.toUpperCase()}] 속성 텍스트 매핑 중...`);

    const textMap = {};
    for (const f of TEXT_FILES) {
      const data = await fetchJSON(`${TEXT_URL}/${repoLang}/${f}`);
      if (data) {
        if (Array.isArray(data)) data.forEach(item => { if (item.Id) textMap[item.Id] = item.Content; });
        else Object.assign(textMap, data);
      }
    }

    const outDir = path.join(__dirname, `../src/data/wuwa/${localLang}`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const elements = {};

    rawElements.forEach(e => {
      // 속성 고유 컬러 가공 (ARGB -> HEX)
      const rawColor = e.ElementColor || "FFFFFFFF";
      const hexColor = `#${rawColor.substring(0, 6)}`;

      elements[e.Id] = {
        id: e.Id,
        name: clean(textMap[e.Name]),
        desc: clean(textMap[e.Describe]),
        color: hexColor,
        // 이미지 최적화 스크립트가 인식할 수 있도록 모든 아이콘 경로 유지
        images: {
          icon: e.Icon,      // 라운드형
          icon_flat: e.Icon5, // 표준 사각형
          icon_shine: e.GachaSpritePath, // 가챠 효과용
          texture: e.ElementChangeTexture // 캐릭터 창 배경 텍스처
        }
      };
    });

    fs.writeFileSync(
      path.join(outDir, 'elements.json'), 
      JSON.stringify(elements, null, 2)
    );
    
    console.log(`   ✨ [${localLang.toUpperCase()}] elements.json 빌드 완료`);
  }
  console.log('\n🏁 속성 데이터 공정이 종결되었습니다.');
}

startElementFactory().catch(console.error);