export default async function handler(req, res) {
  const origin = req.headers.origin;

  const allowedOrigins = [
    'https://english-simply.vercel.app',
    'https://firstai2026.github.io',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
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
      error: 'Method not allowed',
    });
  }

  const word = String(req.query.word || '').trim().toLowerCase();

  if (!word) {
    return res.status(400).json({
      error: 'Missing word',
    });
  }

  try {
    const apiUrl =
      'https://api.dictionaryapi.dev/api/v2/entries/en/' +
      encodeURIComponent(word);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        word,
        audio: null,
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(200).json({
        word,
        audio: null,
      });
    }

    for (const entry of data) {
      if (
        String(entry?.word || '').trim().toLowerCase() !== word
      ) {
        continue;
      }

      for (const phonetic of entry?.phonetics || []) {
        if (phonetic?.audio) {
          return res.status(200).json({
            word,
            audio: phonetic.audio,
          });
        }
      }
    }

    return res.status(200).json({
      word,
      audio: null,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Request failed',
    });
  }
}