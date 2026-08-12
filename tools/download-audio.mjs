import fs from 'fs';
import path from 'path';

const API_KEY = process.env.MERRIAM_KEY;
const backupFile = process.argv[2];

if (!API_KEY) {
  console.error('Ошибка: не указан MERRIAM_KEY');
  console.error('Запусти: MERRIAM_KEY="ТВОЙ_КЛЮЧ" node tools/download-audio.mjs ПУТЬ_К_JSON');
  process.exit(1);
}

if (!backupFile) {
  console.error('Ошибка: не указан JSON-файл с экспортом карточек');
  console.error('Пример: node tools/download-audio.mjs ~/Downloads/english-simply-backup-2026-08-12.json');
  process.exit(1);
}

const backupPath = path.resolve(backupFile);
const audioDir = path.resolve('public/audio');
const audioMapFile = path.resolve('public/audio/audio-map.json');

fs.mkdirSync(audioDir, { recursive: true });

const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

if (!Array.isArray(backup.cards)) {
  console.error('Ошибка: в JSON нет массива cards');
  process.exit(1);
}

const words = [...new Set(
  backup.cards
    .map(card => String(card.front || '').trim().toLowerCase())
    .filter(Boolean)
)];

let audioMap = {};

if (fs.existsSync(audioMapFile)) {
  try {
    audioMap = JSON.parse(fs.readFileSync(audioMapFile, 'utf8'));
  } catch {
    console.warn('Не удалось прочитать существующий audio-map.json. Создаём новый.');
    audioMap = {};
  }
}

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
      const audio = pronunciation?.sound?.audio;

      if (audio) {
        return audio;
      }
    }
  }

  return null;
}

function audioUrl(audioId) {
  const firstLetter = audioId.charAt(0).toLowerCase();

  return (
    `https://media.merriam-webster.com/audio/prons/en/us/mp3/` +
    `${firstLetter}/${audioId}.mp3`
  );
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

    const destination = path.join(audioDir, `${audioId}.mp3`);

    if (!fs.existsSync(destination)) {
      console.log(`  Audio ID: ${audioId}`);
      console.log('  Скачивание...');

      await downloadFile(audioUrl(audioId), destination);

      console.log(`  Готово: public/audio/${audioId}.mp3`);
    } else {
      console.log(`  Уже существует: ${audioId}.mp3`);
    }

    audioMap[word] = `/English-simply/audio/${audioId}.mp3`;
  } catch (error) {
    console.error(`  Ошибка: ${error.message}`);
  }
}

fs.writeFileSync(
  audioMapFile,
  JSON.stringify(audioMap, null, 2) + '\n',
  'utf8'
);

console.log(`\naudio-map.json обновлён.`);
console.log(`Обработано слов: ${words.length}`);
