const fs = require('fs');
const path = require('path');
const { StarRail } = require('starrail.js');

const languages = {
    "kr": "ko", "en": "en", "jp": "ja", "cn": "zh-cn", "cht": "zh-tw",
    "de": "de", "es": "es", "fr": "fr", "id": "id", "pt": "pt",
    "ru": "ru", "th": "th", "vi": "vi"
};

async function syncAll() {
    console.log("🚀 [데이터 공장] 신규 캐릭터 증분 업데이트 모드 가동...");

    const client = new StarRail({ defaultLanguage: "ko" });

    try {
        await client.cachedAssetsManager.fetchAllContents();
        const promoExcel = client.cachedAssetsManager.getExcelData("AvatarPromotionConfig");

        for (const [folderName, apiCode] of Object.entries(languages)) {
            const outputDir = path.join(__dirname, `../src/data/starrail/${folderName}`);
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            // 📂 [1] 기존 파일 로드 (없으면 빈 객체로 시작)
            const loadExisting = (name) => {
                const filePath = path.join(outputDir, name);
                if (fs.existsSync(filePath)) {
                    try {
                        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    } catch (e) { return {}; }
                }
                return {};
            };

            const charactersResult = loadExisting('characters.json');
            const skillsResult = loadExisting('character_skills.json');
            const skillTreesResult = loadExisting('character_skill_trees.json');
            const ranksResult = loadExisting('character_ranks.json');
            const promotionsResult = loadExisting('character_promotions.json');

            const langData = client.cachedAssetsManager.getLanguageData(apiCode);
            
            const cleanTxt = (str) => {
                if (!str) return "";
                return str.replace(/<[^>]*>/g, "").replace(/\[\w+\]/g, "").replace(/\\n/g, "\n")
                          .replace(/\{TEXT#(\d+)\}/g, (match, p1) => langData[p1] || match);
            };

            const getTxt = (input) => {
                if (!input) return "";
                let hash = (typeof input === 'bigint') ? input.toString() : (input.id || input.Hash || "").toString();
                return cleanTxt(langData[hash] || "");
            };

            const toLocalPath = (folder, charId, suffix = "") => {
                if (!charId) return "";
                const fileName = suffix ? `${charId}_${suffix}.webp` : `${charId}.webp`;
                return `starrail/assets/${folder}/${fileName}`;
            };

            const fixVal = (v) => v?.Value ?? (typeof v === 'bigint' ? v.toString() : (v || 0));

            const allChars = client.getAllCharacters();
            let newAddedCount = 0;

            for (const char of allChars) {
                const charId = char.id.toString();

                // 🔍 [2] 신규 ID 체크: 이미 존재하는 캐릭터면 스킵합니다.
                if (charactersResult[charId]) continue;

                newAddedCount++;
                console.log(`✨ 신규 캐릭터 발견: ${getTxt(char.name)} (${charId}) 추가 중...`);

                // [A] 캐릭터 기본 정보
                charactersResult[charId] = {
                    id: charId,
                    name: getTxt(char.name),
                    tag: getTxt(char.name).toLowerCase().replace(/\s/g, ""),
                    rarity: char.stars,
                    path: char.path?.id || "",
                    element: char.combatType?.id || "",
                    max_sp: char.maxEnergy || 0,
                    ranks: char.eidolons.map(e => e.id.toString()),
                    skills: char.skills.map(s => s.id.toString()),
                    skill_trees: (char.skillTreeNodes || []).map(t => t.id.toString()),
                    icon: toLocalPath("icon/character", charId),
                    preview: toLocalPath("image/character_preview", charId),
                    portrait: toLocalPath("image/character_portrait", charId)
                };

                // [B] 스킬 정보
                for (const skill of char.skills) {
                    const skillId = skill.id.toString();
                    const rawLevels = skill._skillsData || [];
                    let suffix = "skill";
                    const sType = (rawLevels[0]?.SkillTriggerKey || skill.skillType || "").toString();
                    if (sType.includes("Normal")) suffix = "basic_atk";
                    else if (sType.includes("Ultra")) suffix = "ultimate";
                    else if (sType.includes("Talent")) suffix = "talent";
                    else if (sType.includes("Maze")) suffix = "technique";

                    skillsResult[skillId] = {
                        id: skillId,
                        char_id: charId,
                        name: getTxt(skill.name),
                        max_level: skill.maxLevel || rawLevels.length,
                        element: char.combatType?.id || "",
                        type_id: sType,
                        type_text: getTxt(rawLevels[0]?.SkillTypeDesc) || getTxt(skill.skillTypeText),
                        effect_text: getTxt(rawLevels[0]?.SkillTag) || getTxt(skill.effectTypeText),
                        simple_desc: getTxt(rawLevels[0]?.SimpleSkillDesc),
                        desc: getTxt(rawLevels[0]?.SkillDesc),
                        params: rawLevels.map(lvl => (lvl.ParamList || []).map(p => fixVal(p))),
                        icon: toLocalPath("icon/skill", charId, suffix)
                    };
                }

                // [C] 행적 정보
                let treeIdx = 1;
                for (const node of char.skillTreeNodes) {
                    const nodeId = node.id.toString();
                    const rawNodeLevels = Array.isArray(node._nodesData) ? node._nodesData : Object.values(node._nodesData || {});
                    skillTreesResult[nodeId] = {
                        id: nodeId,
                        char_id: charId,
                        name: getTxt(rawNodeLevels[0]?.PointName) || getTxt(node.name),
                        max_level: node.maxLevel || rawNodeLevels.length,
                        desc: getTxt(rawNodeLevels[0]?.PointDesc),
                        params: rawNodeLevels.map(lvl => (lvl.ParamList || []).map(p => fixVal(p))),
                        icon: toLocalPath("icon/skill", charId, `skilltree${treeIdx++}`)
                    };
                }

                // [D] 성혼 정보
                for (const rank of char.eidolons) {
                    const rankId = rank.id.toString();
                    const rankNum = rank.rank || (rank.id % 10);
                    ranksResult[rankId] = {
                        id: rankId,
                        name: getTxt(rank.name),
                        rank: rankNum,
                        desc: getTxt(rank.description),
                        icon: toLocalPath("icon/skill", charId, `rank${rankNum}`)
                    };
                }

                // [E] 승급 정보
                const charPromoRaw = promoExcel[charId];
                if (charPromoRaw) {
                    const promoSteps = Object.values(charPromoRaw).sort((a, b) => a.Promotion - b.Promotion);
                    promotionsResult[charId] = {
                        id: charId,
                        values: promoSteps.map(p => ({
                            hp: { base: fixVal(p.HPBase), step: fixVal(p.HPAdd) },
                            atk: { base: fixVal(p.AttackBase), step: fixVal(p.AttackAdd) },
                            def: { base: fixVal(p.DefenceBase), step: fixVal(p.DefenceAdd) },
                            spd: { base: fixVal(p.SpeedBase), step: 0 },
                            taunt: { base: fixVal(p.BaseAggro), step: 0 },
                            crit_rate: { base: fixVal(p.CriticalChance), step: 0 },
                            crit_dmg: { base: fixVal(p.CriticalDamage), step: 0 }
                        })),
                        materials: promoSteps.map(p => (p.PromotionCostList || []).map(cost => ({ id: cost.ItemID.toString(), num: cost.ItemNum })))
                    };
                }
            }

            // 💾 [3] 최종 저장
            const save = (name, data) => fs.writeFileSync(path.join(outputDir, name), JSON.stringify(data, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

            save('characters.json', charactersResult);
            save('character_skills.json', skillsResult);
            save('character_skill_trees.json', skillTreesResult);
            save('character_ranks.json', ranksResult);
            save('character_promotions.json', promotionsResult);
            
            console.log(`✅ [${folderName.toUpperCase()}] 업데이트 완료! (신규 ${newAddedCount}명 추가됨)`);
        }
    } catch (error) { console.error("❌ 에러:", error); } 
    finally { client.close(); }
}

syncAll();