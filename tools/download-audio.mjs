import fs from 'fs';
import path from 'path';

const API_KEY = process.env.MERRIAM_KEY;

if (!API_KEY) {
  console.error('Ошибка: не указан MERRIAM_KEY');
  console.error('Запусти так: MERRIAM_KEY="ТВОЙ_КЛЮЧ" node tools/download-audio.mjs');
  process.exit(1);
}

const wordsFile = path.resolve('tools/words.txt');
const audioDir = path.resolve('public/audio');

fs.mkdirSync(audioDir, { recursive: true });

const words = fs.readFileSync(wordsFile, 'utf8')
  .split(/\r?\n/)
  .map(word => word.trim())
  .filter(Boolean);

async function getAudioId(word) {
  const url =
    `https://www.dictionaryapi.com/api/v3/references/learners/json/` +
    `${encodeURIComponent(word)}?key=${encodeURIComponent(API_KEY)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return null;
  }

  for (const entry of data) {
    const pronunciations = entry?.hwi?.prs;

    if (!Array.isArray(pronunciations)) continue;

    for (const pronunciation of pronunciations) {
      if (pronunciation?.sound?.audio) {
        return pronunciation.sound.audio;
      }
    }
  }

  return null;
}

function audioUrl(audioId) {
  const firstLetter = audioId.charAt(0);

  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/` +
         `${firstLetter}/${audioId}.mp3`;
}

async function downloadFile(url, destination) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MP3 HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, buffer);
}

for (const word of words) {
  console.log(`\nСлово: ${word}`);

  try {
    const audioId = await getAudioId(word);

    if (!audioId) {
      console.log('  Аудио Merriam-Webster не найдено');
      continue;
    }

    const url = audioUrl(audioId);
    const destination = path.join(audioDir, `${audioId}.mp3`);

    if (fs.existsSync(destination)) {
      console.log(`  Уже существует: ${audioId}.mp3`);
      continue;
    }

    console.log(`  Audio ID: ${audioId}`);
    console.log(`  Скачивание...`);

    await downloadFile(url, destination);

    console.log(`  Готово: public/audio/${audioId}.mp3`);
  } catch (error) {
    console.error(`  Ошибка: ${error.message}`);
  }
}

console.log('\nГотово.');
