/**
 * Anki Memory Cast - Comprehensive Application Controller
 * Replicates reference visual design with standard SM-2 scheduling & Ebbinghaus analytics
 * 100% Self-contained for zero-friction loading via file:// or http://
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. SM-2 Spaced Repetition Algorithm
  // =========================================================================
  const SM2_GRADES = {
    AGAIN: 1, // Complete blackout / failed recall
    HARD: 2,  // Recalled with serious difficulty
    GOOD: 3,  // Recalled with some effort
    EASY: 4   // Perfect recall
  };

  function calculateSM2(card, grade) {
    let repetitions = card.repetitions || 0;
    let interval = card.interval || 0;
    let easeFactor = card.easeFactor || 2.5;

    let q;
    if (grade === SM2_GRADES.AGAIN) q = 1;
    else if (grade === SM2_GRADES.HARD) q = 3;
    else if (grade === SM2_GRADES.GOOD) q = 4;
    else if (grade === SM2_GRADES.EASY) q = 5;
    else q = grade;

    if (q < 3) {
      repetitions = 0;
      interval = 1; // 1 day
    } else {
      if (repetitions === 0) {
        if (q === 3) interval = 1;
        else if (q === 4) interval = 1;
        else interval = 3;
      } else if (repetitions === 1) {
        if (q === 3) interval = 2;
        else if (q === 4) interval = 6;
        else interval = 7;
      } else {
        if (q === 3) {
          interval = Math.max(interval + 1, Math.round(interval * 1.2));
        } else if (q === 4) {
          interval = Math.round(interval * easeFactor);
        } else {
          interval = Math.round(interval * easeFactor * 1.3);
        }
      }
      repetitions += 1;
    }

    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
    easeFactor = Math.round(easeFactor * 100) / 100;

    const now = Date.now();
    const dueDate = new Date(now + interval * 24 * 60 * 60 * 1000).toISOString();

    return {
      ...card,
      repetitions,
      interval,
      easeFactor,
      lastReviewed: new Date(now).toISOString(),
      dueDate,
      lastGrade: grade
    };
  }

  function previewIntervals(card) {
    const again = calculateSM2(card, SM2_GRADES.AGAIN);
    const hard = calculateSM2(card, SM2_GRADES.HARD);
    const good = calculateSM2(card, SM2_GRADES.GOOD);
    const easy = calculateSM2(card, SM2_GRADES.EASY);

    return {
      again: formatInterval(again.interval, true),
      hard: formatInterval(hard.interval),
      good: formatInterval(good.interval),
      easy: formatInterval(easy.interval)
    };
  }

  function formatInterval(days, isAgain = false) {
    if (isAgain) return '<10m';
    if (days <= 1) return '1d';
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}y`;
  }

  // =========================================================================
  // 2. LocalStorage & Curated Initial Deck Seed
  // =========================================================================
  const STORAGE_KEY = 'anki_memory_cast_cards_v1';

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
      dueDate: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), // Due now
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
      dueDate: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(), // Future
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

  function getCards() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DECK));
        return JSON.parse(JSON.stringify(INITIAL_DECK));
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DECK));
        return JSON.parse(JSON.stringify(INITIAL_DECK));
      }
      return parsed;
    } catch (e) {
      console.warn('LocalStorage unavailable, using in-memory cards:', e);
      return JSON.parse(JSON.stringify(INITIAL_DECK));
    }
  }

  function saveCards(cards) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
  }

  function isCardDue(card, now = Date.now()) {
    if (!card.dueDate) return false;
    return new Date(card.dueDate).getTime() <= now;
  }

  function isCardNew(card) {
    return (!card.repetitions || card.repetitions === 0) && !card.dueDate;
  }

  function getDueCards(cards = getCards()) {
    const now = Date.now();
    return cards.filter(c => isCardDue(c, now));
  }

  function getNewCards(cards = getCards()) {
    return cards.filter(isCardNew);
  }

  function updateCard(cardId, updates) {
    const cards = getCards();
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      cards[index] = { ...cards[index], ...updates };
      saveCards(cards);
      return cards[index];
    }
    return null;
  }

  function addCard(cardData) {
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

  function resetDefaultDeck() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DECK));
    return JSON.parse(JSON.stringify(INITIAL_DECK));
  }

  // =========================================================================
  // 3. Ebbinghaus Retention Math & Interactive SVG
  // =========================================================================
  function calculateCardRetention(card, now = Date.now()) {
    if (!card.lastReviewed) return card.repetitions > 0 ? 0.9 : 0.4;
    const elapsedDays = Math.max(0, (now - new Date(card.lastReviewed).getTime()) / (24 * 60 * 60 * 1000));
    const stability = Math.max(1, card.interval || 1);
    const retention = Math.exp(-elapsedDays / stability);
    return Math.min(1, Math.max(0.05, retention));
  }

  function calculateDeckStats(cards) {
    if (!cards || cards.length === 0) {
      return {
        total: 0,
        mature: { count: 0, retention: 95 },
        young: { count: 0, retention: 78 },
        learning: { count: 0, retention: 45 },
        avgRetention: 82,
        masteredCount: 0,
        nextReviewDate: null
      };
    }

    const now = Date.now();
    let totalRetention = 0;
    let matureCount = 0;
    let matureRetSum = 0;
    let youngCount = 0;
    let youngRetSum = 0;
    let learningCount = 0;
    let learningRetSum = 0;
    let masteredCount = 0;
    let earliestFutureDue = null;

    cards.forEach(card => {
      const ret = calculateCardRetention(card, now);
      totalRetention += ret;

      const interval = card.interval || 0;
      if (interval >= 21) {
        matureCount++;
        matureRetSum += ret;
        masteredCount++;
      } else if (interval >= 1) {
        youngCount++;
        youngRetSum += ret;
      } else {
        learningCount++;
        learningRetSum += ret;
      }

      if (card.dueDate) {
        const dueTime = new Date(card.dueDate).getTime();
        // Look for next scheduled review
        if (!earliestFutureDue || dueTime < earliestFutureDue) {
          earliestFutureDue = dueTime;
        }
      }
    });

    const avgRetention = Math.round((totalRetention / cards.length) * 100);
    const matureRet = matureCount ? Math.round((matureRetSum / matureCount) * 100) : 94;
    const youngRet = youngCount ? Math.round((youngRetSum / youngCount) * 100) : 78;
    const learningRet = learningCount ? Math.round((learningRetSum / learningCount) * 100) : 48;

    return {
      total: cards.length,
      mature: { count: matureCount, retention: matureRet },
      young: { count: youngCount, retention: youngRet },
      learning: { count: learningCount, retention: learningRet },
      avgRetention,
      masteredCount,
      nextReviewDate: earliestFutureDue ? new Date(earliestFutureDue) : null
    };
  }

  function getCountdownDigits(targetDate) {
    if (!targetDate) {
      return { days: ['0', '1', '2'], hours: ['0', '4'] };
    }

    const now = Date.now();
    const diffMs = targetDate.getTime() - now;

    if (diffMs <= 0) {
      // Due now: show [0][0][0] days [0][0] hours
      return { days: ['0', '0', '0'], hours: ['0', '0'] };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    const daysStr = String(Math.min(999, days)).padStart(3, '0');
    const hoursStr = String(Math.min(99, hours)).padStart(2, '0');

    return {
      days: daysStr.split(''),
      hours: hoursStr.split('')
    };
  }

  function renderEbbinghausSVG(container) {
    if (!container) return;

    const width = 310;
    const height = 145;
    const padLeft = 28;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 26;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const maxDay = 30;

    const getX = (day) => padLeft + (day / maxDay) * plotW;
    const getY = (retentionPct) => padTop + plotH - (retentionPct / 100) * plotH;

    // 1. Base forgetting curve (No reviews: S = 1.2)
    let noReviewPath = `M ${getX(0)} ${getY(100)}`;
    for (let d = 0.2; d <= maxDay; d += 0.5) {
      const r = Math.max(5, Math.exp(-d / 1.5) * 100);
      noReviewPath += ` L ${getX(d).toFixed(1)} ${getY(r).toFixed(1)}`;
    }

    // 2. Spaced Repetition saw-tooth curve
    const reviewStages = [
      { startDay: 0, endDay: 1, s: 1.2 },
      { startDay: 1, endDay: 4, s: 3.5 },
      { startDay: 4, endDay: 12, s: 9.0 },
      { startDay: 12, endDay: 30, s: 28.0 }
    ];

    let spacedPath = '';
    const reviewPoints = [];

    reviewStages.forEach((stage, idx) => {
      const startX = getX(stage.startDay);
      const startY = getY(100);

      if (idx === 0) {
        spacedPath += `M ${startX.toFixed(1)} ${startY.toFixed(1)}`;
      } else {
        spacedPath += ` L ${startX.toFixed(1)} ${startY.toFixed(1)}`;
        reviewPoints.push({
          day: stage.startDay,
          x: startX,
          y: startY,
          label: `R${idx}`
        });
      }

      const step = (stage.endDay - stage.startDay) / 14;
      for (let d = stage.startDay + step; d <= stage.endDay; d += step) {
        const t = d - stage.startDay;
        const r = Math.exp(-t / stage.s) * 100;
        spacedPath += ` L ${getX(d).toFixed(1)} ${getY(r).toFixed(1)}`;
      }
    });

    const areaPath = spacedPath + ` L ${getX(maxDay)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

    const svgHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="ebbinghaus-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="1" />
            <stop offset="100%" stop-color="#FFD6A5" stop-opacity="1" />
          </linearGradient>

          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Y Axis Grid Lines -->
        <line x1="${padLeft}" y1="${getY(100)}" x2="${width - padRight}" y2="${getY(100)}" stroke="rgba(255,255,255,0.18)" stroke-dasharray="2,3" />
        <line x1="${padLeft}" y1="${getY(50)}" x2="${width - padRight}" y2="${getY(50)}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="2,3" />
        <line x1="${padLeft}" y1="${getY(0)}" x2="${width - padRight}" y2="${getY(0)}" stroke="rgba(255,255,255,0.2)" />

        <!-- Y Axis Labels -->
        <text x="${padLeft - 4}" y="${getY(100) + 3}" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" text-anchor="end">100%</text>
        <text x="${padLeft - 4}" y="${getY(50) + 3}" fill="rgba(255,255,255,0.6)" font-size="8.5" font-family="system-ui" text-anchor="end">50%</text>
        <text x="${padLeft - 4}" y="${getY(0) + 3}" fill="rgba(255,255,255,0.6)" font-size="8.5" font-family="system-ui" text-anchor="end">0%</text>

        <!-- Area Under Spaced Curve -->
        <path d="${areaPath}" fill="url(#areaGradient)" />

        <!-- Curve 1: Without Review (Precipitous Exponential decay) -->
        <path d="${noReviewPath}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.6" stroke-dasharray="3,3" />

        <!-- Curve 2: With Spaced Repetition (Saw-tooth retention resets) -->
        <path d="${spacedPath}" fill="none" stroke="url(#curveGradient)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" />

        <!-- Review Reset Points (Warm Orange Highlights) -->
        ${reviewPoints.map(pt => `
          <g class="review-node" transform="translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})">
            <circle r="5" fill="#FF8A48" opacity="0.35" />
            <circle r="3" fill="#FF8A48" stroke="#FFFFFF" stroke-width="1.2" />
            <text y="-8" fill="#FFE2C9" font-size="8" font-weight="700" text-anchor="middle">${pt.label}</text>
          </g>
        `).join('')}

        <!-- X Axis Labels (Days) -->
        <text x="${getX(0)}" y="${height - 6}" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" text-anchor="middle">0d</text>
        <text x="${getX(4)}" y="${height - 6}" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" text-anchor="middle">4d</text>
        <text x="${getX(12)}" y="${height - 6}" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" text-anchor="middle">12d</text>
        <text x="${getX(30)}" y="${height - 6}" fill="rgba(255,255,255,0.7)" font-size="8.5" font-family="system-ui" text-anchor="middle">30d</text>

        <!-- Interactive Scrubber -->
        <g id="interactiveScrubber" opacity="0" pointer-events="none">
          <line id="scrubLine" x1="0" y1="${padTop}" x2="0" y2="${getY(0)}" stroke="#FF8A48" stroke-width="1.2" stroke-dasharray="2,2" />
          <circle id="scrubPoint" cx="0" cy="0" r="4.5" fill="#FFFFFF" stroke="#FF8A48" stroke-width="2" />
        </g>
      </svg>
      <div id="curveTooltip" class="curve-tooltip" style="display: none;"></div>
    `;

    container.innerHTML = svgHTML;

    // Interactive scrubber
    const svg = container.querySelector('.ebbinghaus-svg');
    const scrubber = container.querySelector('#interactiveScrubber');
    const scrubLine = container.querySelector('#scrubLine');
    const scrubPoint = container.querySelector('#scrubPoint');
    const tooltip = container.querySelector('#curveTooltip');

    if (!svg || !scrubber || !tooltip) return;

    function updateScrub(clientX) {
      const rect = svg.getBoundingClientRect();
      const relX = clientX - rect.left;
      const clampedX = Math.max(padLeft, Math.min(width - padRight, (relX / rect.width) * width));
      const day = ((clampedX - padLeft) / plotW) * maxDay;

      let retention = 100;
      let stageInfo = 'Learning phase';
      for (let i = 0; i < reviewStages.length; i++) {
        const s = reviewStages[i];
        if (day >= s.startDay && day <= s.endDay) {
          const t = day - s.startDay;
          retention = Math.round(Math.exp(-t / s.s) * 100);
          stageInfo = i === 0 ? 'Learning phase' : `Repetition stage ${i}`;
          break;
        }
      }

      const curY = getY(retention);
      scrubber.setAttribute('opacity', '1');
      scrubLine.setAttribute('x1', clampedX);
      scrubLine.setAttribute('x2', clampedX);
      scrubPoint.setAttribute('cx', clampedX);
      scrubPoint.setAttribute('cy', curY);

      tooltip.style.display = 'block';
      tooltip.style.left = `${(clampedX / width) * 100}%`;
      tooltip.style.top = `${Math.max(10, (curY / height) * 100 - 30)}%`;
      tooltip.innerHTML = `<strong>Day ${day.toFixed(1)}</strong>: ${retention}% recall <span class="tag">${stageInfo}</span>`;
    }

    svg.addEventListener('mousemove', (e) => updateScrub(e.clientX));
    svg.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) updateScrub(e.touches[0].clientX);
    });

    svg.addEventListener('mouseleave', () => {
      scrubber.setAttribute('opacity', '0');
      tooltip.style.display = 'none';
    });
    svg.addEventListener('touchend', () => {
      scrubber.setAttribute('opacity', '0');
      tooltip.style.display = 'none';
    });
  }

  // =========================================================================
  // 4. Application State & Controller
  // =========================================================================
  const state = {
    currentFilter: 'due', // 'due' | 'new' | 'all'
    searchQuery: '',
    queue: [],
    currentIndex: 0,
    isFlipped: false,
    activeView: 'panorama'
  };

  // DOM Elements cache
  let elements = {};

  function cacheElements() {
    elements = {
      phonesShowcase: document.getElementById('phonesShowcase'),
      viewBtns: document.querySelectorAll('.view-btn'),
      btnResetDeck: document.getElementById('btnResetDeck'),

      // Screen 1
      s1DueCount: document.getElementById('s1DueCount'),
      s1DueCaption: document.getElementById('s1DueCaption'),
      s1QuickReviewBtn: document.getElementById('s1QuickReviewBtn'),
      cardActionDue: document.getElementById('cardActionDue'),
      cardActionLibrary: document.getElementById('cardActionLibrary'),
      s1DueBadge: document.getElementById('s1DueBadge'),
      s1LibraryBadge: document.getElementById('s1LibraryBadge'),
      s1AnalyticsBanner: document.getElementById('s1AnalyticsBanner'),
      s1AvgRetVal: document.getElementById('s1AvgRetVal'),

      // Screen 2
      s2BackBtn: document.getElementById('s2BackBtn'),
      s2QueueProgress: document.getElementById('s2QueueProgress'),
      s2SearchInput: document.getElementById('s2SearchInput'),
      s2SearchClear: document.getElementById('s2SearchClear'),
      s2SearchWrapper: document.getElementById('s2SearchWrapper'),
      s2BannerDeckTitle: document.getElementById('s2BannerDeckTitle'),
      s2BannerSub: document.getElementById('s2BannerSub'),
      s2AddCardTrigger: document.getElementById('s2AddCardTrigger'),
      tileDueNow: document.getElementById('tileDueNow'),
      tileNewWords: document.getElementById('tileNewWords'),
      tileDueCount: document.getElementById('tileDueCount'),
      tileNewCount: document.getElementById('tileNewCount'),

      // Screen 2 Card
      flashcardStage: document.getElementById('flashcardStage'),
      flashcardWrapper: document.getElementById('flashcardWrapper'),
      emptyDeckCard: document.getElementById('emptyDeckCard'),
      emptyDeckTitle: document.getElementById('emptyDeckTitle'),
      emptyDeckMsg: document.getElementById('emptyDeckMsg'),
      emptyDeckActionBtn: document.getElementById('emptyDeckActionBtn'),

      cardPartOfSpeech: document.getElementById('cardPartOfSpeech'),
      cardDeckTag: document.getElementById('cardDeckTag'),
      cardWordTitle: document.getElementById('cardWordTitle'),
      cardPhonetic: document.getElementById('cardPhonetic'),
      btnPronounce: document.getElementById('btnPronounce'),

      cardDefinition: document.getElementById('cardDefinition'),
      cardExampleBox: document.getElementById('cardExampleBox'),
      cardExampleText: document.getElementById('cardExampleText'),
      statInterval: document.getElementById('statInterval'),
      statEase: document.getElementById('statEase'),
      statReps: document.getElementById('statReps'),

      gradingButtonsRow: document.getElementById('gradingButtonsRow'),
      btnAgain: document.getElementById('btnAgain'),
      btnHard: document.getElementById('btnHard'),
      btnGood: document.getElementById('btnGood'),
      btnEasy: document.getElementById('btnEasy'),
      tagAgain: document.getElementById('tagAgain'),
      tagHard: document.getElementById('tagHard'),
      tagGood: document.getElementById('tagGood'),
      tagEasy: document.getElementById('tagEasy'),

      // Screen 3
      s3BackBtn: document.getElementById('s3BackBtn'),
      ebbinghausChartBox: document.getElementById('ebbinghausChartBox'),
      retentionPill: document.getElementById('retentionPill'),
      flipDigitsDay: [
        document.getElementById('digitDay0'),
        document.getElementById('digitDay1'),
        document.getElementById('digitDay2')
      ],
      flipDigitsHour: [
        document.getElementById('digitHour0'),
        document.getElementById('digitHour1')
      ],
      statMasteredWords: document.getElementById('statMasteredWords'),
      statTotalDecks: document.getElementById('statTotalDecks'),

      matureCountMeta: document.getElementById('matureCountMeta'),
      matureBarFill: document.getElementById('matureBarFill'),
      youngCountMeta: document.getElementById('youngCountMeta'),
      youngBarFill: document.getElementById('youngBarFill'),
      learningCountMeta: document.getElementById('learningCountMeta'),
      learningBarFill: document.getElementById('learningBarFill'),

      // Modals
      addCardModal: document.getElementById('addCardModal'),
      addCardCloseBtn: document.getElementById('addCardCloseBtn'),
      addCardCancelBtn: document.getElementById('addCardCancelBtn'),
      addCardForm: document.getElementById('addCardForm'),

      libraryModal: document.getElementById('libraryModal'),
      libraryCloseBtn: document.getElementById('libraryCloseBtn'),
      libraryListContainer: document.getElementById('libraryListContainer'),
      librarySearchInput: document.getElementById('librarySearchInput'),

      toast: document.getElementById('toastNotice')
    };
  }

  function updateQueue(allCards = getCards()) {
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      state.queue = allCards.filter(c =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.deck && c.deck.toLowerCase().includes(q))
      );
    } else if (state.currentFilter === 'due') {
      state.queue = getDueCards(allCards);
    } else if (state.currentFilter === 'new') {
      state.queue = getNewCards(allCards);
    } else {
      state.queue = [...allCards];
    }

    if (state.currentIndex >= state.queue.length) {
      state.currentIndex = Math.max(0, state.queue.length - 1);
    }
  }

  function renderScreen1(allCards, dueCards) {
    const dueCount = dueCards.length;
    elements.s1DueCount.textContent = dueCount;
    elements.s1DueCaption.textContent = dueCount > 0 
      ? `${dueCount} cards ready for optimal memory consolidation`
      : 'All scheduled cards reviewed! Memory stabilized';

    elements.s1DueBadge.textContent = `${dueCount} Due`;
    elements.s1LibraryBadge.textContent = `${allCards.length} Total`;

    const stats = calculateDeckStats(allCards);
    elements.s1AvgRetVal.textContent = `${stats.avgRetention}% Retention`;
  }

  function renderScreen2(allCards, dueCards, newCards) {
    elements.tileDueCount.textContent = dueCards.length;
    elements.tileNewCount.textContent = newCards.length;

    if (state.currentFilter === 'due') {
      elements.tileDueNow.classList.add('purple-active');
      elements.tileDueNow.classList.remove('white-card');
      elements.tileNewWords.classList.remove('purple-active');
      elements.tileNewWords.classList.add('white-card');
    } else if (state.currentFilter === 'new') {
      elements.tileNewWords.classList.add('purple-active');
      elements.tileNewWords.classList.remove('white-card');
      elements.tileDueNow.classList.remove('purple-active');
      elements.tileDueNow.classList.add('white-card');
    } else {
      elements.tileDueNow.classList.remove('purple-active');
      elements.tileDueNow.classList.add('white-card');
      elements.tileNewWords.classList.remove('purple-active');
      elements.tileNewWords.classList.add('white-card');
    }

    const currentCard = state.queue[state.currentIndex];

    if (!currentCard || state.queue.length === 0) {
      elements.flashcardStage.style.display = 'none';
      elements.emptyDeckCard.style.display = 'flex';
      elements.gradingButtonsRow.style.opacity = '0.3';
      elements.gradingButtonsRow.style.pointerEvents = 'none';

      if (state.searchQuery.trim()) {
        elements.emptyDeckTitle.textContent = 'No words match search';
        elements.emptyDeckMsg.textContent = `No flashcards found matching "${state.searchQuery}".`;
        elements.emptyDeckActionBtn.textContent = 'Clear Search';
        elements.emptyDeckActionBtn.onclick = () => {
          elements.s2SearchInput.value = '';
          state.searchQuery = '';
          elements.s2SearchWrapper.classList.remove('has-query');
          refreshAllScreens();
        };
      } else if (state.currentFilter === 'due') {
        elements.emptyDeckTitle.textContent = 'All Due Cards Completed!';
        elements.emptyDeckMsg.textContent = 'Great job! You reviewed all cards scheduled for today.';
        elements.emptyDeckActionBtn.textContent = 'Study New Words';
        elements.emptyDeckActionBtn.onclick = () => {
          state.currentFilter = 'new';
          state.currentIndex = 0;
          refreshAllScreens();
        };
      } else {
        elements.emptyDeckTitle.textContent = 'No Cards in Queue';
        elements.emptyDeckMsg.textContent = 'You have studied all cards in this category.';
        elements.emptyDeckActionBtn.textContent = 'Browse Deck Library';
        elements.emptyDeckActionBtn.onclick = () => openLibraryModal();
      }

      elements.s2QueueProgress.textContent = `0 / 0`;
      return;
    }

    // Active Card View
    elements.flashcardStage.style.display = 'block';
    elements.emptyDeckCard.style.display = 'none';
    elements.gradingButtonsRow.style.opacity = '1';
    elements.gradingButtonsRow.style.pointerEvents = 'auto';

    elements.s2QueueProgress.textContent = `${state.currentIndex + 1} / ${state.queue.length}`;
    elements.s2BannerDeckTitle.textContent = currentCard.deck || 'Core Oxford 3000';
    elements.s2BannerSub.textContent = `Interval: ${currentCard.interval || 0}d • Reps: ${currentCard.repetitions || 0}`;

    // Front
    elements.cardWordTitle.textContent = currentCard.front;
    elements.cardPartOfSpeech.textContent = currentCard.partOfSpeech || 'word';
    elements.cardDeckTag.textContent = currentCard.deck || 'Deck';
    elements.cardPhonetic.textContent = currentCard.phonetic || '';

    // Back
    elements.cardDefinition.textContent = currentCard.back;
    if (currentCard.example) {
      elements.cardExampleBox.style.display = 'block';
      elements.cardExampleText.textContent = `“${currentCard.example}”`;
    } else {
      elements.cardExampleBox.style.display = 'none';
    }

    elements.statInterval.textContent = `${currentCard.interval || 0}d`;
    elements.statEase.textContent = (currentCard.easeFactor || 2.5).toFixed(2);
    elements.statReps.textContent = currentCard.repetitions || 0;

    // Reset flip
    state.isFlipped = false;
    elements.flashcardWrapper.classList.remove('is-flipped');

    // SM-2 button interval previews
    const intervals = previewIntervals(currentCard);
    elements.tagAgain.textContent = intervals.again;
    elements.tagHard.textContent = intervals.hard;
    elements.tagGood.textContent = intervals.good;
    elements.tagEasy.textContent = intervals.easy;
  }

  function renderScreen3(allCards) {
    const stats = calculateDeckStats(allCards);

    renderEbbinghausSVG(elements.ebbinghausChartBox);
    elements.retentionPill.textContent = `${stats.avgRetention}% Recall`;

    updateCountdownDigits(stats.nextReviewDate);

    elements.statMasteredWords.textContent = stats.masteredCount;
    const uniqueDecks = new Set(allCards.map(c => c.deck || 'General')).size;
    elements.statTotalDecks.textContent = `${uniqueDecks} Active`;

    elements.matureCountMeta.textContent = `${stats.mature.count} words | ${stats.mature.retention}% retention`;
    elements.matureBarFill.style.width = `${stats.mature.retention}%`;

    elements.youngCountMeta.textContent = `${stats.young.count} words | ${stats.young.retention}% retention`;
    elements.youngBarFill.style.width = `${stats.young.retention}%`;

    elements.learningCountMeta.textContent = `${stats.learning.count} words | ${stats.learning.retention}% retention`;
    elements.learningBarFill.style.width = `${stats.learning.retention}%`;
  }

  function updateCountdownDigits(targetDate) {
    const digits = getCountdownDigits(targetDate);

    digits.days.forEach((d, i) => {
      if (elements.flipDigitsDay[i]) elements.flipDigitsDay[i].textContent = d;
    });

    digits.hours.forEach((h, i) => {
      if (elements.flipDigitsHour[i]) elements.flipDigitsHour[i].textContent = h;
    });
  }

  function toggleFlip() {
    state.isFlipped = !state.isFlipped;
    if (state.isFlipped) {
      elements.flashcardWrapper.classList.add('is-flipped');
    } else {
      elements.flashcardWrapper.classList.remove('is-flipped');
    }
  }

  function gradeActiveCard(grade) {
    const currentCard = state.queue[state.currentIndex];
    if (!currentCard) return;

    const updatedCard = calculateSM2(currentCard, grade);
    updateCard(currentCard.id, updatedCard);

    showToast(`Rated ${getGradeLabel(grade)} • Next review in ${updatedCard.interval}d`);

    elements.flashcardWrapper.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
    elements.flashcardWrapper.style.transform = 'scale(0.94) translateY(8px)';
    elements.flashcardWrapper.style.opacity = '0';

    setTimeout(() => {
      refreshAllScreens();
      elements.flashcardWrapper.style.transform = '';
      elements.flashcardWrapper.style.opacity = '1';
      elements.flashcardWrapper.style.transition = '';
    }, 200);
  }

  function getGradeLabel(grade) {
    switch (grade) {
      case SM2_GRADES.AGAIN: return 'Again';
      case SM2_GRADES.HARD: return 'Hard';
      case SM2_GRADES.GOOD: return 'Good';
      case SM2_GRADES.EASY: return 'Easy';
      default: return 'Reviewed';
    }
  }

  function pronounceCurrentWord() {
    const currentCard = state.queue[state.currentIndex];
    if (!currentCard || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(currentCard.front);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function setViewMode(mode) {
    state.activeView = mode;
    elements.viewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === mode);
    });

    elements.phonesShowcase.className = 'phones-showcase';
    if (mode !== 'panorama') {
      elements.phonesShowcase.classList.add(`focus-${mode}`);
    }
  }

  function refreshAllScreens() {
    const allCards = getCards();
    const dueCards = getDueCards(allCards);
    const newCards = getNewCards(allCards);

    updateQueue(allCards);
    renderScreen1(allCards, dueCards);
    renderScreen2(allCards, dueCards, newCards);
    renderScreen3(allCards);
  }

  function openAddCardModal() {
    elements.addCardModal.classList.add('is-open');
    document.getElementById('newCardFront').focus();
  }

  function closeAddCardModal() {
    elements.addCardModal.classList.remove('is-open');
  }

  function openLibraryModal() {
    renderLibraryList('');
    elements.librarySearchInput.value = '';
    elements.libraryModal.classList.add('is-open');
  }

  function closeLibraryModal() {
    elements.libraryModal.classList.remove('is-open');
  }

  function renderLibraryList(query = '') {
    const allCards = getCards();
    const q = query.toLowerCase().trim();
    const filtered = q
      ? allCards.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q))
      : allCards;

    if (filtered.length === 0) {
      elements.libraryListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--muted-slate); font-size: 13px;">
          No cards found matching "${query}".
        </div>
      `;
      return;
    }

    elements.libraryListContainer.innerHTML = filtered.map(card => `
      <div class="deck-browser-item">
        <div class="browser-item-left">
          <h5>${card.front} <span style="font-weight: 500; font-size: 12px; color: var(--muted-slate);">${card.phonetic || ''}</span></h5>
          <p>${card.back}</p>
        </div>
        <div style="text-align: right;">
          <span class="browser-item-badge">${card.interval || 0}d interval</span>
        </div>
      </div>
    `).join('');
  }

  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2400);
  }

  function setupEventListeners() {
    // Top View Switchers
    elements.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => setViewMode(btn.dataset.view));
    });

    // Reset Deck
    elements.btnResetDeck.addEventListener('click', () => {
      if (confirm('Reset to standard initial vocabulary deck? All review intervals will be restored.')) {
        resetDefaultDeck();
        state.currentIndex = 0;
        state.searchQuery = '';
        state.currentFilter = 'due';
        refreshAllScreens();
        showToast('Deck reset to default state');
      }
    });

    // Screen 1 Action Handlers
    elements.cardActionDue.addEventListener('click', () => {
      state.currentFilter = 'due';
      state.currentIndex = 0;
      state.searchQuery = '';
      setViewMode('screen-2');
      refreshAllScreens();
    });

    elements.s1QuickReviewBtn.addEventListener('click', () => {
      state.currentFilter = 'due';
      state.currentIndex = 0;
      state.searchQuery = '';
      setViewMode('screen-2');
      refreshAllScreens();
    });

    elements.cardActionLibrary.addEventListener('click', () => {
      openLibraryModal();
    });

    elements.s1AnalyticsBanner.addEventListener('click', () => {
      setViewMode('screen-3');
    });

    // Screen 2 Navigation & Search
    elements.s2BackBtn.addEventListener('click', () => {
      setViewMode('screen-1');
    });

    elements.s2SearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentIndex = 0;
      elements.s2SearchWrapper.classList.toggle('has-query', !!state.searchQuery);
      refreshAllScreens();
    });

    elements.s2SearchClear.addEventListener('click', () => {
      elements.s2SearchInput.value = '';
      state.searchQuery = '';
      elements.s2SearchWrapper.classList.remove('has-query');
      refreshAllScreens();
    });

    // Category Tiles
    elements.tileDueNow.addEventListener('click', () => {
      state.currentFilter = 'due';
      state.currentIndex = 0;
      refreshAllScreens();
    });

    elements.tileNewWords.addEventListener('click', () => {
      state.currentFilter = 'new';
      state.currentIndex = 0;
      refreshAllScreens();
    });

    // Card Flip & Speech
    elements.flashcardWrapper.addEventListener('click', toggleFlip);
    elements.btnPronounce.addEventListener('click', (e) => {
      e.stopPropagation();
      pronounceCurrentWord();
    });

    // Grading Buttons
    elements.btnAgain.addEventListener('click', (e) => {
      e.stopPropagation();
      gradeActiveCard(SM2_GRADES.AGAIN);
    });

    elements.btnHard.addEventListener('click', (e) => {
      e.stopPropagation();
      gradeActiveCard(SM2_GRADES.HARD);
    });

    elements.btnGood.addEventListener('click', (e) => {
      e.stopPropagation();
      gradeActiveCard(SM2_GRADES.GOOD);
    });

    elements.btnEasy.addEventListener('click', (e) => {
      e.stopPropagation();
      gradeActiveCard(SM2_GRADES.EASY);
    });

    // Screen 3 Navigation
    elements.s3BackBtn.addEventListener('click', () => {
      setViewMode('screen-2');
    });

    // Global Keyboard Shortcuts: Space flips card, 1-4 grades
    window.addEventListener('keydown', (e) => {
      if (elements.addCardModal.classList.contains('is-open') || elements.libraryModal.classList.contains('is-open')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === '1') {
        gradeActiveCard(SM2_GRADES.AGAIN);
      } else if (e.key === '2') {
        gradeActiveCard(SM2_GRADES.HARD);
      } else if (e.key === '3') {
        gradeActiveCard(SM2_GRADES.GOOD);
      } else if (e.key === '4') {
        gradeActiveCard(SM2_GRADES.EASY);
      }
    });

    // Modal: Add Flashcard
    elements.s2AddCardTrigger.addEventListener('click', openAddCardModal);
    elements.addCardCloseBtn.addEventListener('click', closeAddCardModal);
    elements.addCardCancelBtn.addEventListener('click', closeAddCardModal);
    elements.addCardModal.addEventListener('click', (e) => {
      if (e.target === elements.addCardModal) closeAddCardModal();
    });

    elements.addCardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const front = document.getElementById('newCardFront').value;
      const back = document.getElementById('newCardBack').value;
      const phonetic = document.getElementById('newCardPhonetic').value;
      const partOfSpeech = document.getElementById('newCardPos').value;
      const example = document.getElementById('newCardExample').value;
      const deck = document.getElementById('newCardDeck').value;

      if (!front || !back) return;

      addCard({ front, back, phonetic, partOfSpeech, example, deck });
      closeAddCardModal();
      elements.addCardForm.reset();
      showToast(`Added "${front}" to Deck!`);
      refreshAllScreens();
    });

    // Modal: Library
    elements.libraryCloseBtn.addEventListener('click', closeLibraryModal);
    elements.libraryModal.addEventListener('click', (e) => {
      if (e.target === elements.libraryModal) closeLibraryModal();
    });

    elements.librarySearchInput.addEventListener('input', (e) => {
      renderLibraryList(e.target.value);
    });

    // Minute timer for countdown update
    setInterval(() => {
      const stats = calculateDeckStats(getCards());
      updateCountdownDigits(stats.nextReviewDate);
    }, 60000);
  }

  function init() {
    cacheElements();
    setupEventListeners();
    refreshAllScreens();
  }

  // Expose API if needed
  window.AnkiMemoryCast = {
    calculateSM2,
    calculateDeckStats,
    getCards,
    addCard,
    init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
