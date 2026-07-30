import fs from 'fs';
import { translate } from '@vitalets/google-translate-api';

const i18nPath = './src/services/i18n.js';
let content = fs.readFileSync(i18nPath, 'utf8');

// Use regex to parse the English object keys
const englishBlockMatch = content.match(/English:\s*{([^}]+)}/);
if (!englishBlockMatch) {
  console.error("Could not find English block");
  process.exit(1);
}
const englishBlock = englishBlockMatch[1];
const keys = [];
const keyRegex = /"([^"]+)"\s*:/g;
let match;
while ((match = keyRegex.exec(englishBlock)) !== null) {
  keys.push(match[1]);
}

// Add the new keys that we added to UI strings but might not be in the dictionary
const newKeys = [
  "Portal", "Email", "SMS & WhatsApp", "Security", "Grading", "Roles", 
  "User Guide", "Teacher Panel", "Parent Capacity Building", "AI Lesson Planner", 
  "My Profile", "Curriculum", "Children", "Centers"
];

for (const k of newKeys) {
  if (!keys.includes(k)) keys.push(k);
}

const langs = {
  English: 'en',
  Hindi: 'hi',
  Marathi: 'mr',
  Telugu: 'te',
  Kannada: 'kn',
  Tamil: 'ta',
  Gujarati: 'gu',
  Malayalam: 'ml'
};

async function run() {
  const finalTranslations = {};
  
  for (const [langName, langCode] of Object.entries(langs)) {
    finalTranslations[langName] = {};
    console.log(`Translating for ${langName}...`);
    
    // We can do chunked translation to save time
    for (const key of keys) {
      if (langCode === 'en') {
        finalTranslations[langName][key] = key;
        continue;
      }
      
      try {
        const res = await translate(key, { to: langCode });
        finalTranslations[langName][key] = res.text;
      } catch (e) {
        console.error(`Error translating ${key} to ${langCode}:`, e.message);
        finalTranslations[langName][key] = key; // fallback
      }
    }
  }

  let finalObjStr = "export const translations = {\n";
  for (const [langName, dict] of Object.entries(finalTranslations)) {
    finalObjStr += `  ${langName}: {\n`;
    for (const [k, v] of Object.entries(dict)) {
      finalObjStr += `    ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`;
    }
    finalObjStr += `  },\n`;
  }
  finalObjStr += "};\n";

  // Replace old translations block
  const newContent = content.replace(/const translations = \{[\s\S]*?\};\n\n\/\/ Language event system/, finalObjStr + '\n// Language event system');
  
  fs.writeFileSync(i18nPath, newContent);
  console.log("Done updating i18n.js");
}

run();
