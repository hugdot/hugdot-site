import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// [데이터] 13개 전체 지원 언어
const languages = {
  'ko': 'kr', 'en': 'en', 'ja': 'jp', 'zh-Hans': 'chs', 'zh-Hant': 'cht',
  'de': 'de', 'es': 'es', 'fr': 'fr', 'id': 'id', 'pt': 'pt', 'ru': 'ru', 'th': 'th', 'vi': 'vi'
};

const RAW_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/ConfigDB';
const TEXT_URL = 'https://raw.githubusercontent.com/Dimbreath/WutheringData/master/TextMap';

// [데이터] 가공에 필요한 모든 테이블 정의
const TABLES = {
  weapons: 'WeaponConf.json',
  weaponGrowth: 'WeaponPropertyGrowth.json',
  weaponBreach: 'WeaponBreach.json',
  baseStats: 'BaseProperty.json',
  echoItems: 'PhantomItem.json',
  echoSets: 'PhantomFetterGroup.json',
  echoEffects: 'PhantomFetter.json',
  monsterInfo: 'MonsterInfo.json',
  items: 'ItemInfo.json',
  synthesis: 'SynthesisFormula.json',
  accessPath: 'AccessPath.json'
};

// [데이터] 모든 텍스트 리소스
const TEXT_FILES = ['MultiText.json', 'TidText.json', 'MultiText_1sthalf.json', 'MultiText_2ndhalf.json', 'Speaker.json', 'MonsterDisplay.json'];

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

function clean(str) {
  if (!str) return "";
  // HTML 태그 제거 및 줄바꿈 정리
  return str.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n').trim();
}

async function startUltimateWikiFactory() {
  console.log('🚀 [전 종목 통합 공정] 캐릭터 외 모든 데이터(무기/에코/아이템) 빌드 시작...');

  const raw = {};
  for (const [key, fileName] of Object.entries(TABLES)) {
    raw[key] = await fetchJSON(`${RAW_URL}/${fileName}`) || [];
    console.log(` ✅ 로드 완료: ${fileName}`);
  }

  for (const [repoLang, localLang] of Object.entries(languages)) {
    console.log(`\n🌎 [${localLang.toUpperCase()}] 언어 데이터 가공 중...`);

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

    // --- [1] 에코(Echoes) & 세트 멤버 맵 생성 ---
    const echoes = {};
    const set_members_map = {};

    raw.echoItems.forEach(e => {
      const id = e.ItemId.toString();
      const monster = raw.monsterInfo.find(m => m.Id === e.MonsterId);
      const name = clean(textMap[monster?.Name || e.MonsterName]);
      
      echoes[id] = {
        id,
        name,
        cost: e.PhantomType,
        rarity: e.Rarity,
        set_ids: e.FetterGroup || [],
        icon: e.Icon,
        monster_id: e.MonsterId
      };

      // 세트별 멤버 리스트 구축 (3번 파일을 위해)
      (e.FetterGroup || []).forEach(setId => {
        if (!set_members_map[setId]) set_members_map[setId] = [];
        set_members_map[setId].push({ id, name, icon: e.Icon, cost: e.PhantomType });
      });
    });

    // --- [2] 에코 세트(Echo Sets) 상세 (수치 치환 및 멤버 포함) ---
    const echo_sets = {};
    raw.echoSets.forEach(s => {
      const effects = raw.echoEffects.filter(eff => s.FetterMap.includes(eff.Id));
      
      echo_sets[s.Id] = {
        id: s.Id,
        name: clean(textMap[s.FetterGroupName]),
        effects: effects.map(eff => {
          let desc = clean(textMap[eff.EffectDescription]);
          const params = eff.EffectDescriptionParam || [];
          // {0}, {1} 등 자리 표시자를 실제 수치로 치환
          params.forEach((p, idx) => { desc = desc.replace(`{${idx}}`, p); });

          return {
            need_num: eff.Priority === 1 ? 2 : 5, 
            desc: desc,
            params: params
          };
        }),
        members: set_members_map[s.Id] || [] // 이 세트에 포함된 몬스터 리스트
      };
    });

    // --- [3] 무기(Weapons) 상세 (90레벨 스탯 및 돌파) ---
    const weapons = {};
    raw.weapons.forEach(w => {
      const id = w.ItemId.toString();
      const base = raw.baseStats.find(b => b.Id === w.ItemId && b.Lv === 1) || {};
      const stats_progression = raw.weaponGrowth.filter(g => g.CurveId === w.FirstCurve).map(g => ({
        level: g.Level,
        atk: Math.floor((base.Atk || 0) * (g.CurveValue / 10000))
      }));

      weapons[id] = {
        id,
        name: clean(textMap[w.WeaponName]),
        rarity: w.QualityId,
        type: w.WeaponType,
        desc: clean(textMap[w.Desc]),
        params: w.DescParams || [],
        icon: w.Icon,
        stats_progression,
        ascension: (raw.weaponBreach.filter(b => b.BreachId === w.BreachId) || []).map(b => ({
          level_limit: b.LevelLimit,
          costs: (b.Consume || []).map(c => ({ item_id: c.Key, count: c.Value }))
        }))
      };
    });

    // --- [4] 아이템(Items) 상세 (합성 및 획득처) ---
    const items = {};
    raw.items.forEach(i => {
      const id = i.Id.toString();
      const formula = raw.synthesis.find(s => s.ItemId === i.Id);
      const sources = (i.ItemAccess || []).map(aId => {
        const pathData = raw.accessPath.find(p => p.Id === aId);
        return clean(textMap[pathData?.Description]);
      }).filter(Boolean);

      items[id] = {
        id,
        name: clean(textMap[i.Name]),
        rarity: i.QualityId,
        desc: clean(textMap[i.AttributesDescription]),
        icon: i.Icon,
        sources,
        recipe: formula ? formula.ConsumeItems.map(c => ({ item_id: c.ItemId, count: c.Count })) : null
      };
    });

    // 파일 저장
    const save = (name, data) => fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2));
    save('weapons', weapons);
    save('echoes', echoes);
    save('echo_sets', echo_sets);
    save('items', items);
    
    console.log(`   ✨ [${localLang.toUpperCase()}] 모든 JSON 빌드 완료`);
  }
  console.log('\n🏁 [성공] 모든 데이터 공정이 완료되었습니다. 위키 구축을 시작하세요!');
}

startUltimateWikiFactory().catch(console.error);