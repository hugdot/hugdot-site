const fs = require('fs');
const path = require('path');
const https = require('https');
const JSONbig = require('json-bigint')({ useNativeBigInt: true });

// [설정] 폴더명 : 원천 언어 코드
const languages = {
    "kr": "KR", "en": "EN", "jp": "JP", "chs": "CHS", "cht": "CHT",
    "de": "DE", "es": "ES", "fr": "FR", "id": "ID", "pt": "PT",
    "ru": "RU", "th": "TH", "vi": "VI"
};

const BASE_URL = "https://gitlab.com/Dimbreath/turnbasedgamedata/-/raw/main";

/**
 * [리다이렉트 추적형 fetch]
 * GitLab의 대용량 파일 리다이렉트를 끝까지 추적하여 Raw 데이터를 가져옵니다.
 */
async function fetchWithRedirect(url) {
    return new Promise((resolve, reject) => {
        const request = (targetUrl) => {
            https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return request(res.headers.location);
                }
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${targetUrl}`));
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => resolve(body));
            }).on('error', reject);
        };
        request(url);
    });
}

function cleanTxt(str) {
    if (!str) return "";
    return str.replace(/<[^>]*>/g, "").replace(/\[\w+\]/g, "").replace(/\\n/g, "\n");
}

async function startAchievementFactory() {
    console.log("🚀 [업적 공장] 분할 사전 통합 및 13개국어 공정 시작...");

    try {
        // 1. 업적 본체 데이터 로드 (BigInt 처리)
        console.log("⏳ AchievementData.json 로드 중...");
        const rawAchData = await fetchWithRedirect(`${BASE_URL}/ExcelOutput/AchievementData.json`);
        const achList = JSONbig.parse(rawAchData);
        console.log(`✅ 업적 본체 확보 완료 (총 ${achList.length}개)`);

        // 2. 각 언어별 사전 통합 및 가공
        for (const [folderName, mapCode] of Object.entries(languages)) {
            console.log(`\n📂 [${folderName.toUpperCase()}] 가공 시작...`);
            
            const integratedMap = {};
            // 사장님이 스크린샷에서 확인하신 분할 규칙 (Main, _0, _1)
            const mapFiles = [`TextMapMain${mapCode}.json`, `TextMap${mapCode}_0.json`, `TextMap${mapCode}_1.json` ];

            for (const file of mapFiles) {
                try {
                    const rawMap = await fetchWithRedirect(`${BASE_URL}/TextMap/${file}`);
                    const jsonMap = JSON.parse(rawMap);
                    Object.assign(integratedMap, jsonMap);
                    console.log(`   - ${file} 병합 완료`);
                } catch (e) {
                    // _1 파일은 언어에 따라 없을 수도 있으므로 무시
                }
            }

            const result = {};

            // 3. 통합된 사전으로 데이터 매핑
            achList.forEach(item => {
                const id = item.AchievementID.toString();
                const titleHash = item.AchievementTitle?.Hash?.toString() || "";
                const descHash = item.AchievementDesc?.Hash?.toString() || "";
                const hideDescHash = item.ShowAfterFinishDesc?.Hash?.toString() || "";

                result[id] = {
                    id: id,
                    series_id: item.SeriesID.toString(),
                    title: cleanTxt(integratedMap[titleHash]),
                    desc: cleanTxt(integratedMap[descHash]),
                    hide_desc: cleanTxt(integratedMap[hideDescHash]),
                    hide: item.ShowType === "ShowAfterFinish"
                };
            });

            // 4. 저장
            const outputDir = path.join(__dirname, `../src/data/starrail/${folderName}`);
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
            
            fs.writeFileSync(
                path.join(outputDir, 'achievements.json'), 
                JSON.stringify(result, null, 2)
            );
            
            console.log(`✅ ${folderName.toUpperCase()} 저장 완료! (업적: ${Object.keys(result).length}개)`);
            
            // 메모리 해제 보조
            for (let key in integratedMap) delete integratedMap[key];
        }

        console.log("\n🏁 모든 국가의 업적 데이터 공정이 완벽하게 끝났습니다!");
    } catch (error) {
        console.error("❌ 치명적 오류:", error.message);
    }
}

startAchievementFactory();