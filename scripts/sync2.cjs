const fs = require('fs');
const path = require('path');
const { StarRail } = require('starrail.js');

const languages = {
    "kr": "ko", "en": "en", "jp": "ja", "chs": "zh-cn", "cht": "zh-tw",
    "de": "de", "es": "es", "fr": "fr", "id": "id", "pt": "pt",
    "ru": "ru", "th": "th", "vi": "vi"
};

async function syncElements() {
    console.log("🚀 [속성 공장] elements.json 독립 추출 공정 시작...");

    const client = new StarRail({ defaultLanguage: "ko" });
    const cam = client.cachedAssetsManager;

    try {
        console.log("📦 기계 시스템 가동 및 DamageType 에셋 로드...");
        await cam.fetchAllContents();

        // [실사 결과] DamageType 데이터 확보
        const elementExcel = cam.getExcelData("DamageType");

        for (const [folderName, apiCode] of Object.entries(languages)) {
            console.log(`📂 [${folderName.toUpperCase()}] 속성 가공 중...`);
            const langData = cam.getLanguageData(apiCode);
            
            // 1. [정제 엔진] HTML 태그 제거 및 개행 처리
            const cleanTxt = (str) => {
                if (!str) return "";
                return str
                    .replace(/<[^>]*>/g, "") 
                    .replace(/\[\w+\]/g, "") 
                    .replace(/\\n/g, "\n")
                    .replace(/\{TEXT#(\d+)\}/g, (match, p1) => langData[p1] || match);
            };

            // 2. [추출 엔진] BigInt 해시 대응
            const getTxt = (input) => {
                if (!input) return "";
                let hash = "";
                if (typeof input === 'bigint') hash = input.toString();
                else if (typeof input === 'object') {
                    // DamageTypeName: { Hash: ... } 구조 대응
                    const rawId = input.id || input.Hash;
                    if (rawId) hash = rawId.toString();
                }
                const rawTxt = hash ? (langData[hash] || "") : "";
                return cleanTxt(rawTxt);
            };

            const elementResult = {};

            // 3. 데이터 매핑 (샘플 규격 100% 준수)
            Object.values(elementExcel).forEach(item => {
                const id = item.ID; // Physical, Fire 등
                elementResult[id] = {
                    id: id,
                    name: getTxt(item.DamageTypeName),
                    desc: getTxt(item.DamageTypeIntro),
                    color: item.Color || "#FFFFFF",
                    icon: `icon/element/${id}.webp`
                };
            });

            // 4. 저장 폴더 생성 및 파일 쓰기
            const outputDir = path.join(__dirname, `../src/data/starrail/${folderName}`);
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            fs.writeFileSync(
                path.join(outputDir, 'elements.json'), 
                JSON.stringify(elementResult, null, 2)
            );
        }

        console.log("\n🏁 모든 국가의 속성 데이터 공정 완료!");
    } catch (error) {
        console.error("❌ 공정 중 오류 발생:", error);
    } finally {
        client.close();
    }
}

syncElements();