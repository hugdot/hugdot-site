import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 설정 ---
const DATA_DIR = path.join(__dirname, '../src/data/wuwa/kr'); 
const OUTPUT_BASE_DIR = path.join(__dirname, '../public/wuwa/assets'); 
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/555me/Wuthering-Waves-GameAssets/main';

// [카테고리 판별] 큰 분류만 정하고, 하위 폴더는 필드명(key)을 그대로 사용
function getBaseCategory(gamePath, fileName) {
    const p = gamePath.toLowerCase();
    const f = fileName.toLowerCase();

    if (f.includes('resonator')) return 'character';
    if (f.includes('weapon')) return 'weapon';
    if (f.includes('element')) return 'element';
    if (f.includes('echo') || p.includes('phantom')) return 'echo';
    if (f.includes('item')) return 'item';
    if (f.includes('skill')) return 'skill';
    
    return 'misc';
}

async function processData() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        let content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let isModified = false;

        console.log(`\n📂 파일 처리 중: ${file}`);

        // [핵심] 재귀 함수에서 ID와 현재 필드명(Key)을 추적
        const transform = async (obj, currentId = null) => {
            if (!obj || typeof obj !== 'object') return;

            // 현재 객체에서 ID 추출
            const id = obj.id || obj.ItemId || obj.Id || currentId;

            for (const key in obj) {
                const value = obj[key];

                if (typeof value === 'string' && value.startsWith('/Game/Aki/')) {
                    // 1. 대분류 결정 (파일 이름 기반)
                    const baseCat = getBaseCategory(value, file);
                    
                    // 2. [핵심] 하위 폴더명을 JSON 필드명(key)으로 사용
                    const subCat = key; 

                    // 3. 파일명은 고유 ID로 설정
                    const finalFileName = id ? id.toString() : value.split('/').pop().split('.')[0];
                    
                    // 4. 최종 경로 조합 (예: /wuwa/assets/character/portrait/1102.webp)
                    const localWebPath = `/wuwa/assets/${baseCat}/${subCat}/${finalFileName}.webp`;
                    const fullOutputPath = path.join(OUTPUT_BASE_DIR, baseCat, subCat, `${finalFileName}.webp`);

                    await downloadAndConvert(value, fullOutputPath);

                    // 5. JSON 경로 업데이트
                    obj[key] = localWebPath;
                    isModified = true;
                } else if (typeof value === 'object' && value !== null) {
                    // 하위 객체로 내려갈 때 현재 ID 전달
                    await transform(value, id);
                }
            }
        };

        if (!Array.isArray(content)) {
            for (const k in content) await transform(content[k], k);
        } else {
            await transform(content);
        }

        if (isModified) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            console.log(`✅ ${file} 경로 및 필드명 폴더 동기화 완료`);
        }
    }
}

async function downloadAndConvert(gamePath, outputPath) {
    if (fs.existsSync(outputPath)) return; 

    const remoteUrl = `${GITHUB_RAW_BASE}${gamePath.split('.')[0]}.png`.replace('/Game/Aki', '');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {
        const response = await axios({
            url: remoteUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 8000
        });

        await sharp(response.data)
            .webp({ quality: 90 })
            .toFile(outputPath);
        
        console.log(`  📸 저장: ${outputPath.split('assets')[1]}`);
    } catch (err) {
        // 실패 시 무시
    }
}

console.log('🚀 [필드명 기반] 에셋 최적화 및 JSON 동기화 시작...');
processData();