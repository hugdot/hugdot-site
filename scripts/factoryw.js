import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// [복구] 13개 전체 지원 언어
const languages = {
  'ko': 'kr', 'en': 'en', 'ja': 'jp', 'zh-Hans': 'chs', 'zh-Hant': 'cht',
  'de': 'de', 'es': 'es', 'fr': 'fr', 'id': 'id', 'pt': 'pt', 'ru': 'ru', 'th': 'th', 'vi': 'vi'
};

const RAW_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/ConfigDB';
const TEXT_BASE_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/TextMap';

const TABLES = {
  resonators: 'RoleInfo.json',
  baseStats: 'BaseProperty.json',      // 🎯 실마리: 기본 스탯
  growth: 'RolePropertyGrowth.json',   // 레벨별 성장 계수
  breach: 'RoleBreach.json',           // 돌파 정보
  skills: 'Skill.json',
  skillLevels: 'SkillLevel.json',
  chains: 'ResonantChain.json',
  items: 'ItemInfo.json'
};

// [복구] 5개 전체 텍스트 소스
const TEXT_FILES = [
  'MultiText.json', 
  'MultiText_1sthalf.json', 
  'MultiText_2ndhalf.json', 
  'TidText.json', 
  'Speaker.json'
];

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

async function startFullFactory() {
  console.log('🚀 [초고밀도 공정] 13개 언어 및 캐릭터/스킬/체인 정밀 빌드 시작...');

  const raw = {};
  for (const [key, fileName] of Object.entries(TABLES)) {
    raw[key] = await fetchJSON(`${RAW_URL}/${fileName}`) || [];
    console.log(` ✅ 데이터 로드: ${fileName}`);
  }

  for (const [repoLang, localLang] of Object.entries(languages)) {
    console.log(`\n🌎 [${localLang.toUpperCase()}] 언어팩 통합 중...`);
    
    const textMap = {};
    for (const f of TEXT_FILES) {
      const data = await fetchJSON(`${TEXT_BASE_URL}/${repoLang}/${f}`);
      if (data) {
        if (Array.isArray(data)) data.forEach(item => { if (item.Id) textMap[item.Id] = item.Content; });
        else Object.assign(textMap, data);
      }
    }

    const outDir = path.join(__dirname, `../src/data/wuwa/${localLang}`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const resonators = {};
    const resonator_skills = {};
    const resonator_chains = {};

    const playable = raw.resonators.filter(r => r.RoleType === 1);

    playable.forEach(r => {
      const id = r.Id.toString();
      
      // 1. 캐릭터 스탯 (BaseProperty + Growth 기반 1-90레벨 정밀 계산)
      const base = raw.baseStats.find(b => b.Id === r.PropertyId && b.Lv === 1) || {};
      const stats_progression = raw.growth.map(g => ({
        level: g.Level,
        phase: g.BreachLevel,
        hp: Math.floor((base.LifeMax || 0) * (g.LifeMaxRatio / 10000)),
        atk: Math.floor((base.Atk || 0) * (g.AtkRatio / 10000)),
        def: Math.floor((base.Def_ || 0) * (g.DefRatio / 10000))
      }));

      // 2. 캐릭터 상세 (모든 이미지 필드 및 돌파 비용 포함)
      resonators[id] = {
        id,
        name: clean(textMap[r.Name]),
        rarity: r.QualityId,
        element: r.ElementId,
        weapon_type: r.WeaponType,
        images: {
          portrait: r.RolePortrait,
          head_icon: r.RoleHeadIcon,
          card: r.Card,
          element_icon: r.Icon,
          weapon_icon: r.WeaponIcon
        },
        stats_progression,
        // [깊이] 돌파 단계별 요구 재료 (Key/Value 구조 반영 및 아이템명 매핑)
        ascension: (raw.breach.filter(b => b.BreachGroupId === r.BreachId) || []).map(b => ({
          phase: b.BreachLevel,
          unlock_level: b.ConditionLevel,
          costs: (b.BreachConsume || []).map(c => {
            const item = raw.items.find(i => i.Id === c.Key);
            return {
              item_id: c.Key,
              item_name: clean(textMap[item?.Name]),
              item_icon: item?.Icon || "",
              count: c.Value
            };
          })
        }))
      };

      // 3. 캐릭터 스킬 (레벨별 소모 재료 및 계수 정보)
      raw.skills.filter(s => s.SkillGroupId === r.SkillId).forEach(s => {
        resonator_skills[s.Id] = {
          id: s.Id.toString(),
          owner_id: id,
          name: clean(textMap[s.SkillName]),
          type: s.SkillType,
          desc: clean(textMap[s.SkillDescribe]),
          icon: s.Icon,
          // [깊이] 스킬 레벨업 비용 매핑
          levels: raw.skillLevels.filter(sl => sl.SkillId === s.Id).map(sl => ({
            id: sl.Id,
            costs: (sl.Consume || []).map(c => {
              const item = raw.items.find(i => i.Id === c.Key);
              return {
                item_id: c.Key,
                item_name: clean(textMap[item?.Name]),
                count: c.Value
              };
            })
          })),
          multipliers: s.SkillDetailNum || [] // 계수 (SkillDamage 연동의 기초)
        };
      });

      // 4. 캐릭터 체인 (돌파 단계별 효과 및 수치)
      raw.chains.filter(c => c.GroupId === r.ResonantChainGroupId).forEach(c => {
        resonator_chains[c.Id] = {
          id: c.Id.toString(),
          owner_id: id,
          node: c.GroupIndex,
          name: clean(textMap[c.NodeName]),
          desc: clean(textMap[c.AttributesDescription]),
          params: c.AttributesDescriptionParams || [],
          icon: c.NodeIcon
        };
      });
    });

    const save = (name, data) => fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2));
    save('resonators', resonators);
    save('resonator_skills', resonator_skills);
    save('resonator_chains', resonator_chains);
    
    console.log(`   ✨ [${localLang.toUpperCase()}] 13개 언어 데이터셋 생성 완료.`);
  }
  console.log('\n🏁 모든 언어와 데이터 공정이 완료되었습니다.');
}

startFullFactory().catch(console.error);