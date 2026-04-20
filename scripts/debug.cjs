const { StarRail } = require('starrail.js');
const util = require('util');

async function findJadeOrigin() {
    const client = new StarRail({ defaultLanguage: "ko" });
    const cam = client.cachedAssetsManager;
    
    try {
        console.log("🚀 [아이템 역추적] '성옥'의 진짜 위치를 수사합니다...");
        await cam.fetchAllContents();

        // 1. "성옥"이라는 글자의 해시값부터 확보
        const langData = cam.getLanguageData("ko");
        let jadeHash = null;
        for (const [hash, text] of Object.entries(langData)) {
            if (text === "성옥") {
                jadeHash = hash;
                console.log(`🎯 [텍스트 발견] '성옥'의 해시: ${jadeHash}`);
                break;
            }
        }

        if (!jadeHash) {
            console.log("❌ 사전에서 '성옥'을 찾지 못했습니다. 사전이 필터링된 상태입니다.");
            return;
        }

        console.log("\n=== [1] 현재 로드된 28개 파일 내부 수색 ===");
        const excels = cam._excels; // 승인된 28개 명단
        let foundFile = null;

        for (const fileName of excels) {
            try {
                const data = cam.getExcelData(fileName);
                const dataStr = JSON.stringify(data);
                if (dataStr.includes(jadeHash)) {
                    console.log(`🎯 발견! [${fileName}] 파일 안에 '성옥' 해시가 들어있습니다.`);
                    foundFile = fileName;
                    break;
                }
            } catch (e) { /* 로드 실패 무시 */ }
        }

        if (!foundFile) {
            console.log("❌ 현재 로드된 28개 파일 중에는 '성옥'이 없습니다.");
            console.log("\n=== [2] 기계 지식 지도(Master Index) 정밀 해부 ===");
            
            // _githubCache가 ConfigFile 인스턴스이므로getValue("data")로 접근
            const masterIndex = cam._githubCache.getValue ? cam._githubCache.getValue("data") : cam._githubCache;
            
            if (masterIndex) {
                const allFileKeys = Object.keys(masterIndex);
                console.log(`- 서버 인덱스에 등록된 파일 수: ${allFileKeys.length}개`);
                
                // 'ItemConfig'로 시작하는 모든 파일명 출력
                const itemCandidates = allFileKeys.filter(k => k.startsWith('ItemConfig'));
                console.log("- 발견된 아이템 관련 원천 파일들:", itemCandidates);
                
                // 만약 'ItemConfig.json'이나 'ItemConfigVirtual.json'이 있다면 그것이 범인입니다.
                const jadeTarget = itemCandidates.find(k => k === "ItemConfig.json" || k === "ItemConfigVirtual.json");
                if (jadeTarget) {
                    console.log(`\n💡 [수사 결론] 성옥은 [${jadeTarget}]에 있습니다.`);
                    console.log(`👉 이 파일은 현재 기계의 '전투 필수' 목록에서 빠져있어 로드되지 않은 것입니다.`);
                }
            }
        }

    } catch (error) {
        console.error("❌ 수사 중 오류:", error);
    } finally {
        client.close();
    }
}

findJadeOrigin.call(); // 내부 바인딩 문제 방지를 위해 call 사용
findJadeOrigin();