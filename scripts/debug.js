import https from 'https';

const RAW_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/ConfigDB';
const TEXT_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/TextMap/ko';

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

async function scanForBestDescription() {
  console.log('🕵️ 속성별 진짜 설명을 찾기 위해 텍스트 키 규칙을 분석합니다...');

  const combinedMap = await fetchJSON(`${TEXT_URL}/MultiText.json`) || {};
  Object.assign(combinedMap, await fetchJSON(`${TEXT_URL}/TidText.json`) || {});

  const elementIds = [1, 2, 3, 4, 5, 6];
  const results = {};

  elementIds.forEach(id => {
    console.log(`\n--- 속성 ID [${id}] 관련 텍스트 검색 ---`);
    
    // 규칙성 있는 키 후보들 검색
    const candidates = [
      `Text_Element_${id}_Text`,
      `Text_Element_${id}_Desc`,
      `Text_Element_${id}_Intro`,
      `Element_${id}_Describe`,
      `Element_${id}_Content`,
      `Attribute_${id}_Desc`,
      `Resonance_${id}_Desc`
    ];

    candidates.forEach(key => {
      if (combinedMap[key]) {
        console.log(`[${key}]: ${combinedMap[key].slice(0, 100)}`);
      }
    });

    // 키 이름에 ID가 포함되어 있고 "피해"라는 단어가 들어있는 짧은 문장 검색
    const patternMatch = Object.keys(combinedMap).find(key => 
      key.includes(`_${id}_`) && 
      combinedMap[key].includes('피해') && 
      combinedMap[key].length < 50 &&
      !combinedMap[key].includes('오류')
    );

    if (patternMatch) {
      console.log(`💡 추천 설명 키: [${patternMatch}] -> ${combinedMap[patternMatch]}`);
    }
  });
}

scanForBestDescription();