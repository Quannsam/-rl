/**
 * LocalStorage Data Manager for Flashcards and SM-2 State
 * Zero-cloud, 100% client-side persistence
 */

const STORAGE_KEY = 'anki_memory_cast_cards_v1';

// Initial curated deck seed
const INITIAL_DECK = [
  {
    id: 'card_1',
    front: 'Ephemeral',
    back: 'Lasting for a very short time; transitory; fleeting.',
    phonetic: '/ɪˈfem.ər.əl/',
    partOfSpeech: 'adjective',
    example: 'The ephemeral bloom of cherry blossoms draws millions of admirers every spring.',
    deck: 'Core Oxford 3000',
    repetitions: 1,
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), // Due now (12 hours ago)
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
  },
  {
    id: 'card_2',
    front: 'Ubiquitous',
    back: 'Present, appearing, or found everywhere simultaneously.',
    phonetic: '/juːˈbɪk.wə.təs/',
    partOfSpeech: 'adjective',
    example: 'Smartphones have become ubiquitous across every modern urban center.',
    deck: 'Core Oxford 3000',
    repetitions: 2,
    interval: 2,
    easeFactor: 2.6,
    dueDate: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // Due now
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 50).toISOString()
  },
  {
    id: 'card_3',
    front: 'Serendipity',
    back: 'The occurrence and development of events by chance in a happy or beneficial way.',
    phonetic: '/ˌser.ənˈdɪp.ə.ti/',
    partOfSpeech: 'noun',
    example: 'Finding his favorite childhood book in a distant bookstore was pure serendipity.',
    deck: 'Core Oxford 3000',
    repetitions: 3,
    interval: 6,
    easeFactor: 2.4,
    dueDate: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), // Due now
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 145).toISOString()
  },
  {
    id: 'card_4',
    front: 'Resilient',
    back: 'Able to withstand or recover quickly from difficult conditions.',
    phonetic: '/rɪˈzɪl.jənt/',
    partOfSpeech: 'adjective',
    example: 'Ecological systems are remarkably resilient when biodiversity is safeguarded.',
    deck: 'Core Oxford 3000',
    repetitions: 4,
    interval: 24, // Mature card (>21d)
    easeFactor: 2.65,
    dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 14).toISOString(), // Future
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString()
  },
  {
    id: 'card_5',
    front: 'Pernicious',
    back: 'Having a harmful effect, especially in a gradual or subtle way.',
    phonetic: '/pɚˈnɪʃ.əs/',
    partOfSpeech: 'adjective',
    example: 'The pernicious influence of chronic sleep deprivation is often overlooked.',
    deck: 'Core Oxford 3000',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: null, // New word
    lastReviewed: null
  },
  {
    id: 'card_6',
    front: 'Esoteric',
    back: 'Intended for or likely to be understood by only a small number of people with specialized knowledge.',
    phonetic: '/ˌes.əˈter.ɪk/',
    partOfSpeech: 'adjective',
    example: 'Quantum physics equations can appear esoteric to non-specialists.',
    deck: 'Advanced Academic',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: null, // New word
    lastReviewed: null
  },
  {
    id: 'card_7',
    front: 'Pragmatic',
    back: 'Dealing with things sensibly and realistically, based on practical rather than theoretical considerations.',
    phonetic: '/præɡˈmæt̬.ɪk/',
    partOfSpeech: 'adjective',
    example: 'The team adopted a pragmatic approach to meet the tight product launch deadline.',
    deck: 'Core Oxford 3000',
    repetitions: 2,
    interval: 4,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(), // 2 days future
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString()
  },
  {
    id: 'card_8',
    front: 'Mellifluous',
    back: 'Sweet or musical; pleasant to hear.',
    phonetic: '/məˈlɪf.lu.əs/',
    partOfSpeech: 'adjective',
    example: 'The narrator possessed a mellifluous voice that captivated the entire auditorium.',
    deck: 'Advanced Academic',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: null, // New word
    lastReviewed: null
  },
  {
    id: 'card_9',
    front: 'Taciturn',
    back: 'Reserved or uncommunicative in speech; saying little.',
    phonetic: '/ˈtæs.ə.tɝːn/',
    partOfSpeech: 'adjective',
    example: 'Though taciturn in casual conversation, his written briefs were exceptionally articulate.',
    deck: 'Advanced Academic',
    repetitions: 1,
    interval: 1,
    easeFactor: 2.35,
    dueDate: new Date(Date.now() - 3600 * 1000 * 4).toISOString(), // Due now
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 28).toISOString()
  },
  {
    id: 'card_10',
    front: 'Quintessential',
    back: 'Representing the most perfect or typical example of a quality or class.',
    phonetic: '/ˌkwɪn.təˈsen.ʃəl/',
    partOfSpeech: 'adjective',
    example: 'Afternoon tea is considered the quintessential British tradition.',
    deck: 'Core Oxford 3000',
    repetitions: 3,
    interval: 28, // Mature card
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 20).toISOString(),
    lastReviewed: new Date(Date.now() - 3600 * 1000 * 24 * 8).toISOString()
  }
];

export function getCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DECK));
      return [...INITIAL_DECK];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DECK));
      return [...INITIAL_DECK];
    }
    return parsed;
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return [...INITIAL_DECK];
  }
}

export function saveCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

export function isCardDue(card, now = Date.now()) {
  if (!card.dueDate) return false;
  return new Date(card.dueDate).getTime() <= now;
}

export function isCardNew(card) {
  return (!card.repetitions || card.repetitions === 0) && !card.dueDate;
}

export function getDueCards(cards = getCards()) {
  const now = Date.now();
  return cards.filter(c => isCardDue(c, now));
}

export function getNewCards(cards = getCards()) {
  return cards.filter(isCardNew);
}

export function updateCard(cardId, updates) {
  const cards = getCards();
  const index = cards.findIndex(c => c.id === cardId);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updates };
    saveCards(cards);
    return cards[index];
  }
  return null;
}

export function addCard(cardData) {
  const cards = getCards();
  const newCard = {
    id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    front: cardData.front.trim(),
    back: cardData.back.trim(),
    phonetic: cardData.phonetic ? cardData.phonetic.trim() : '',
    partOfSpeech: cardData.partOfSpeech || 'noun',
    example: cardData.example ? cardData.example.trim() : '',
    deck: cardData.deck ? cardData.deck.trim() : 'General',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    dueDate: null,
    lastReviewed: null
  };
  cards.unshift(newCard);
  saveCards(cards);
  return newCard;
}

export function resetDefaultDeck() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DECK));
  return [...INITIAL_DECK];
}
