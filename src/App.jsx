import { useState, useEffect, useMemo } from 'react';
import { APP_VERSION, uid, todayStr, shuffleArr, fileToDataUrl, resizeImageFile } from './utils/helpers.js';
import { isDue, isReverseDue, boxOf, LEARNED_BOX, isReverseUnlocked, reviewCard } from './utils/srs.js';
import { storageGet, storageSet, storageDelete } from './utils/storage.js';
import { GlobalStyle } from './components/GlobalStyle.jsx';
import { Header } from './components/Header.jsx';
import { DecksView } from './pages/DecksView.jsx';
import { DeckView } from './pages/DeckView.jsx';
import { StatsView } from './pages/StatsView.jsx';
import { SessionDoneView } from './components/SessionDoneView.jsx';
import { MatchGame } from './games/MatchGame.jsx';
import { MatchChoice } from './games/MatchChoice.jsx';
import { ListeningGame } from './games/ListeningGame.jsx';
import { MixedPractice } from './games/MixedPractice.jsx';
import { StudyView } from './study/StudyView.jsx';
import { DeckFormModal } from './modals/DeckFormModal.jsx';
import { CardFormModal } from './modals/CardFormModal.jsx';

export default function App() {
  const [decks, setDecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('decks');
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [studyQueue, setStudyQueue] = useState([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mediaCache, setMediaCache] = useState({});
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [sessionReviewed, setSessionReviewed] = useState(0);

  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [importError, setImportError] = useState(null);
  const [matchHard, setMatchHard] = useState(false);
  const [matchPool, setMatchPool] = useState([]);
  const [matchDistractors, setMatchDistractors] = useState([]);

  /* ---------- Load / Save ---------- */

  useEffect(() => {
    Promise.all([
      storageGet('decks'),
      storageGet('cards'),
      storageGet('streak'),
    ]).then(([decksRaw, cardsRaw, streakRaw]) => {
      if (decksRaw) setDecks(JSON.parse(decksRaw));
      if (cardsRaw) setCards(JSON.parse(cardsRaw));
      if (streakRaw) setStreak(JSON.parse(streakRaw));
    });
  }, []);

  useEffect(() => { if (decks.length > 0) storageSet('decks', JSON.stringify(decks)); }, [decks]);
  useEffect(() => { if (cards.length > 0) storageSet('cards', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { storageSet('streak', JSON.stringify(streak)); }, [streak]);

  /* ---------- Derived data ---------- */

  const currentDeck = decks.find(d => d.id === currentDeckId) || null;
  const deckCards = useMemo(() => cards.filter(c => c.deckId === currentDeckId), [cards, currentDeckId]);

  const stats = useMemo(() => {
    const total = cards.length;
    const dueToday = cards.filter(c => isDue(c) || isReverseDue(c)).length;
    const neu = cards.filter(c => boxOf(c) === 0).length;
    const learning = cards.filter(c => boxOf(c) > 0 && boxOf(c) < LEARNED_BOX).length;
    const mastered = cards.filter(c => boxOf(c) >= LEARNED_BOX).length;
    const reverseUnlocked = cards.filter(c => isReverseUnlocked(c)).length;
    return { total, dueToday, neu, learning, mastered, reverseUnlocked };
  }, [cards]);

  const overallAccuracy = useMemo(() => {
    let totalReps = 0;
    let totalWrong = 0;
    cards.forEach(c => {
      if (c.srs) totalReps += c.srs.reps || 0;
      if (c.srsReverse) totalReps += c.srsReverse.reps || 0;
      totalWrong += c.wrongCount || 0;
    });
    if (totalReps === 0) return null;
    return Math.round(((totalReps - totalWrong) / totalReps) * 100);
  }, [cards]);

  const problemWords = useMemo(() => {
    return [...cards]
      .filter(c => (c.wrongCount || 0) > 0)
      .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
  }, [cards]);

  /* ---------- Load media for current study card ---------- */

  useEffect(() => {
    if (view === 'study' && studyQueue[studyIndex]) {
      const c = studyQueue[studyIndex];
      if ((c.hasAudio || c.hasImage) && mediaCache[c.id] === undefined) {
        storageGet('media:' + c.id).then(raw => {
          if (raw) setMediaCache(prev => ({ ...prev, [c.id]: JSON.parse(raw) }));
        });
      }
    }
  }, [view, studyIndex, studyQueue]);

  /* ---------- SRS ---------- */

  function applyReview(cardId, direction, knew) {
    setCards(prev => prev.map(c => c.id === cardId ? reviewCard(c, knew, direction) : c));
    setSessionReviewed(r => r + 1);
  }

  function updateStreak() {
    const today = todayStr();
    if (streak.lastDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;
    setStreak({ count: newCount, lastDate: today });
  }

  /* ---------- Navigation ---------- */

  function openDeck(id) {
    setCurrentDeckId(id);
    setView('deck');
  }

  function goBack() {
    if (view === 'deck') {
      setView('decks');
      setCurrentDeckId(null);
    } else if (view === 'stats') {
      setView(currentDeckId ? 'deck' : 'decks');
    } else {
      setView('deck');
    }
  }

  /* ---------- Study ---------- */

  function startStudy() {
    const queue = [];
    deckCards.forEach(c => {
      if (isDue(c)) queue.push({ ...c, dir: 'forward' });
      if (isReverseDue(c)) queue.push({ ...c, dir: 'reverse' });
    });
    setStudyQueue(shuffleArr(queue));
    setStudyIndex(0);
    setFlipped(false);
    setSessionReviewed(0);
    setView('study');
  }

  function handleStudyAnswer(knew) {
    const item = studyQueue[studyIndex];
    applyReview(item.id, item.dir, knew);
    if (studyIndex + 1 >= studyQueue.length) {
      updateStreak();
      setView('sessionDone');
    } else {
      setStudyIndex(i => i + 1);
      setFlipped(false);
    }
  }

  /* ---------- Practice ---------- */

  function startPractice() {
    setView('practice');
  }

  function startMixedFromStats() {
    if (currentDeckId) {
      setView('practice');
    } else {
      setView('decks');
    }
  }

  /* ---------- Games ---------- */

  function startMatch(hard) {
    setMatchHard(hard);
    const shuffled = shuffleArr(deckCards);
    const gameCount = Math.min(shuffled.length, hard ? 6 : 8);
    setMatchPool(shuffled.slice(0, gameCount));
    setMatchDistractors(hard ? shuffled.slice(gameCount, Math.min(shuffled.length, gameCount + 4)) : []);
    setView('match');
  }

  function startMatchChoice() {
    const shuffled = shuffleArr(deckCards);
    setMatchPool(shuffled.slice(0, Math.min(shuffled.length, 10)));
    setView('matchChoice');
  }

  function startListening() {
    setView('listening');
  }

  function getListeningPool() {
    return deckCards.filter(c => boxOf(c) >= LEARNED_BOX);
  }

  /* ---------- Deck CRUD ---------- */

  function addDeck(name) {
    setDecks(prev => [...prev, { id: uid(), name: name.trim() }]);
    setShowDeckModal(false);
  }

  function deleteDeck() {
    deckCards.forEach(c => storageDelete('media:' + c.id));
    setCards(prev => prev.filter(c => c.deckId !== currentDeckId));
    setDecks(prev => prev.filter(d => d.id !== currentDeckId));
    setView('decks');
    setCurrentDeckId(null);
  }

  /* ---------- Card CRUD ---------- */

  async function saveCard(data, mediaInfo) {
    let cardId;
    if (editingCard) {
      cardId = editingCard.id;
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...data } : c));
    } else {
      cardId = uid();
      const newCard = {
        id: cardId,
        deckId: currentDeckId,
        ...data,
        hasImage: false,
        hasAudio: false,
        wrongCount: 0,
        srs: null,
        srsReverse: null,
      };
      setCards(prev => [...prev, newCard]);
    }
    await saveMedia(cardId, mediaInfo);
    setShowCardModal(false);
    setEditingCard(null);
  }

  async function saveMedia(cardId, mediaInfo) {
    let media = {};
    const existingRaw = await storageGet('media:' + cardId);
    if (existingRaw) media = JSON.parse(existingRaw);

    if (mediaInfo.clearImage) {
      delete media.image;
    } else if (mediaInfo.image) {
      media.image = await resizeImageFile(mediaInfo.image);
    }

    if (mediaInfo.clearAudio) {
      delete media.audio;
    } else if (mediaInfo.audio) {
      media.audio = await fileToDataUrl(mediaInfo.audio);
    } else if (mediaInfo.audioUrl) {
      media.audio = mediaInfo.audioUrl;
    }

    if (Object.keys(media).length > 0) {
      await storageSet('media:' + cardId, JSON.stringify(media));
    } else {
      await storageDelete('media:' + cardId);
    }

    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, hasImage: !!media.image, hasAudio: !!media.audio } : c
    ));
  }

  function deleteCard(cardId) {
    storageDelete('media:' + cardId);
    setCards(prev => prev.filter(c => c.id !== cardId));
  }

  function resetCard(cardId) {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, srs: null, srsReverse: null, wrongCount: 0 } : c
    ));
  }

  function forceDue(cardId) {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, srs: null, srsReverse: null } : c
    ));
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setStudyQueue([{ ...card, dir: 'forward' }]);
      setStudyIndex(0);
      setFlipped(false);
      setSessionReviewed(0);
      setView('study');
    }
  }

  /* ---------- Export / Import ---------- */

  function exportAll() {
    const data = { decks, cards, streak, version: APP_VERSION };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'english-simply-backup-' + todayStr() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.decks || !data.cards) {
        setImportError('Неверный формат файла');
        return;
      }
      setDecks(data.decks);
      setCards(data.cards);
      if (data.streak) setStreak(data.streak);
      setImportError(null);
      setView('decks');
    } catch (e) {
      setImportError('Не удалось прочитать файл: ' + e.message);
    }
  }

  /* ---------- Render ---------- */

  const studyItem = studyQueue[studyIndex];

  return (
    <div className="dc-root" style={{ minHeight: '100vh' }}>
      <GlobalStyle />

      {view === 'decks' && (
        <>
          <Header
            title="Карточки"
            showStreak={true}
            streakCount={streak.count}
            version={APP_VERSION}
            onStats={() => setView('stats')}
          />
          <DecksView
            decks={decks}
            cards={cards}
            onOpenDeck={openDeck}
            onNewDeck={() => setShowDeckModal(true)}
            onExportAll={exportAll}
            onImportFile={importFile}
            importError={importError}
          />
        </>
      )}

      {view === 'deck' && currentDeck && (
        <>
          <Header
            title={currentDeck.name}
            onBack={goBack}
            onStats={() => setView('stats')}
            showStreak={true}
            streakCount={streak.count}
          />
          <DeckView
            deck={currentDeck}
            deckCards={deckCards}
            onStartStudy={startStudy}
            onStartPractice={startPractice}
            onStartMatch={startMatch}
            onStartMatchChoice={startMatchChoice}
            onStartListening={startListening}
            onAddCard={() => { setEditingCard(null); setShowCardModal(true); }}
            onEditCard={(card) => { setEditingCard(card); setShowCardModal(true); }}
            onDeleteCard={deleteCard}
            onResetCard={resetCard}
            onForceDue={forceDue}
            onDeleteDeck={deleteDeck}
          />
        </>
      )}

      {view === 'study' && studyItem && (
        <StudyView
          card={studyItem}
          media={mediaCache[studyItem.id]}
          direction={studyItem.dir}
          flipped={flipped}
          onFlip={() => setFlipped(f => !f)}
          onAnswer={handleStudyAnswer}
          progress={`${studyIndex + 1} / ${studyQueue.length}`}
          onExit={() => setView('deck')}
        />
      )}

      {view === 'practice' && (
        <MixedPractice
          pool={deckCards}
          applyReview={applyReview}
          onExit={() => { updateStreak(); setView('deck'); }}
        />
      )}

      {view === 'match' && (
        <>
          <Header title="Связки слов" onBack={goBack} />
          <MatchGame
            gameCards={matchPool}
            distractorCards={matchDistractors}
            onExit={() => setView('deck')}
          />
        </>
      )}

      {view === 'matchChoice' && (
        <>
          <Header title="Связки слов (уровень 3)" onBack={goBack} />
          <MatchChoice
            pool={matchPool}
            onExit={() => setView('deck')}
          />
        </>
      )}

      {view === 'listening' && (
        <>
          <Header title="На слух" onBack={goBack} />
          <ListeningGame
            pool={getListeningPool()}
            onExit={() => setView('deck')}
          />
        </>
      )}

      {view === 'stats' && (
        <>
          <Header title="Статистика" onBack={goBack} />
          <StatsView
            stats={stats}
            streak={streak}
            overallAccuracy={overallAccuracy}
            problemWords={problemWords}
            onStartMixed={startMixedFromStats}
          />
        </>
      )}

      {view === 'sessionDone' && (
        <SessionDoneView
          reviewedCount={sessionReviewed}
          streakCount={streak.count}
          onDone={() => setView('deck')}
        />
      )}

      {showDeckModal && (
        <DeckFormModal
          onSave={addDeck}
          onClose={() => setShowDeckModal(false)}
        />
      )}
      {showCardModal && (
        <CardFormModal
          deckId={currentDeckId}
          editingCard={editingCard}
          existingCards={deckCards}
          onSave={saveCard}
          onClose={() => { setShowCardModal(false); setEditingCard(null); }}
        />
      )}
    </div>
  );
}