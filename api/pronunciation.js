export default async function handler(req, res) {
  const origin = req.headers.origin;

  const allowedOrigins = [
    'https://firstai2026.github.io',
    'http://127.0.0.1:5173',
    'http://localhost:5173'
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const word = String(req.query.word || '')
    .trim()
    .toLowerCase();

  if (!word) {
    return res.status(400).json({
      error: 'Missing word'
    });
  }

  if (!process.env.MERRIAM_KEY) {
    return res.status(500).json({
      error: 'MERRIAM_KEY is not configured'
    });
  }

  try {
    // Merriam-Webster: pronunciation
    const merriamUrl =
      'https://www.dictionaryapi.com/api/v3/references/learners/json/' +
      encodeURIComponent(word) +
      '?key=' +
      encodeURIComponent(process.env.MERRIAM_KEY);

    const merriamResponse = await fetch(merriamUrl);

    let audio = null;

    if (merriamResponse.ok) {
      const data = await merriamResponse.json();

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
    }

    // Dictionary API: examples
    const dictionaryUrl =
      'https://api.dictionaryapi.dev/api/v2/entries/en/' +
      encodeURIComponent(word);

    const dictionaryResponse = await fetch(dictionaryUrl);

    let examples = [];
    let notFound = false;

    if (dictionaryResponse.status === 404) {
      notFound = true;
    } else if (dictionaryResponse.ok) {
      const dictionaryData = await dictionaryResponse.json();

      if (Array.isArray(dictionaryData)) {
        for (const entry of dictionaryData) {
          const meanings = entry?.meanings;

          if (!Array.isArray(meanings)) {
            continue;
          }

          for (const meaning of meanings) {
            const definitions = meaning?.definitions;

            if (!Array.isArray(definitions)) {
              continue;
            }

            for (const definition of definitions) {
              if (definition?.example) {
                examples.push(definition.example);
              }
            }
          }
        }
      }
    }

    examples = [...new Set(examples)];

    return res.status(200).json({
      word,
      audio,
      examples,
      notFound
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Request failed'
    });
  }
}
