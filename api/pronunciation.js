export default async function handler(req, res) {
  // Разрешаем запросы с GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', 'https://firstai2026.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Ответ на CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Разрешаем только GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const word = String(req.query.word || '')
    .trim()
    .toLowerCase();

  if (!word) {
    return res.status(400).json({
      error: 'Missing word',
    });
  }

  if (!process.env.MERRIAM_KEY) {
    return res.status(500).json({
      error: 'MERRIAM_KEY is not configured',
    });
  }

  try {
    const apiUrl =
      'https://www.dictionaryapi.com/api/v3/references/learners/json/' +
      encodeURIComponent(word) +
      '?key=' +
      encodeURIComponent(process.env.MERRIAM_KEY);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return res.status(502).json({
        error: `Merriam-Webster HTTP ${response.status}`,
      });
    }

    const data = await response.json();

    let audio = null;

    if (Array.isArray(data)) {
      for (const entry of data) {
        const pronunciations = entry?.hwi?.prs;

        if (!Array.isArray(pronunciations)) {
          continue;
        }

        for (const pronunciation of pronunciations) {
          const audioId = pronunciation?.sound?.audio;

          if (!audioId) {
            continue;
          }

          const firstLetter = audioId.charAt(0).toLowerCase();

          audio =
            'https://media.merriam-webster.com/audio/prons/en/us/mp3/' +
            firstLetter +
            '/' +
            audioId +
            '.mp3';

          break;
        }

        if (audio) {
          break;
        }
      }
    }

    return res.status(200).json({
      word,
      audio,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Request failed',
    });
  }
}
