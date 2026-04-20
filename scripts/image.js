import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 데이터 루트 경로 (본인의 프로젝트 구조에 맞게 조정)
const DATA_ROOT = path.join(__dirname, '../src/data/starrail');

// 1. 모든 언어 폴더 가져오기 (ko, en, jp, ru 등)
const languages = fs.readdirSync(DATA_ROOT).filter(file => 
  fs.statSync(path.join(DATA_ROOT, file)).isDirectory()
);

languages.forEach((lang) => {
  const filePath = path.join(DATA_ROOT, lang, 'simulated_curios.json');
  
  // 파일이 존재하는지 확인
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  [${lang}] 파일이 없어 건너뜁니다: ${filePath}`);
    return;
  }

  try {
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const uniqueMap = new Map();

    // 2. 가공 로직 (경로 수정 + 이름 중복 제거)
    Object.values(rawData).forEach((item) => {
      const curName = item.name;
      const curId = parseInt(item.id);

      // 아이콘 경로 수정
      if (item.icon) {
        item.icon = item.icon.replace('/icon/character/', '/icon/curio/');
      }

      // 중복 제거 (낮은 ID 우선)
      if (!uniqueMap.has(curName)) {
        uniqueMap.set(curName, item);
      } else {
        const existingItem = uniqueMap.get(curName);
        if (curId < parseInt(existingItem.id)) {
          uniqueMap.set(curName, item);
        }
      }
    });

    // 3. 기존 파일 덮어씌우기
    const cleanedData = Object.fromEntries(uniqueMap);
    fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2), 'utf-8');
    
    console.log(`✅ [${lang}] 가공 완료: ${Object.keys(cleanedData).length}개 기물 저장됨.`);

  } catch (err) {
    console.error(`❌ [${lang}] 처리 중 오류 발생:`, err);
  }
});

console.log('\n🚀 모든 언어 파일에 대한 클리닝 작업이 완료되었습니다.');