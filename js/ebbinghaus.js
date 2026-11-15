/**
 * Ebbinghaus Retention Curve Mathematics and Interactive SVG Renderer
 * Formula: R = e^(-t / S)
 * Where:
 *  - R: Retention probability (0.0 to 1.0, or 0% to 100%)
 *  - t: Time elapsed since last review (days)
 *  - S: Memory stability (proportional to interval, in days)
 */

export function calculateCardRetention(card, now = Date.now()) {
  if (!card.lastReviewed) return card.repetitions > 0 ? 0.9 : 0.4;
  const elapsedDays = Math.max(0, (now - new Date(card.lastReviewed).getTime()) / (24 * 60 * 60 * 1000));
  const stability = Math.max(1, card.interval || 1);
  const retention = Math.exp(-elapsedDays / stability);
  return Math.min(1, Math.max(0.05, retention));
}

export function calculateDeckStats(cards) {
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
  let earliestDue = null;

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
      if (!earliestDue || dueTime < earliestDue) {
        earliestDue = dueTime;
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
    nextReviewDate: earliestDue ? new Date(earliestDue) : null
  };
}

/**
 * Calculates countdown digits [D][D][D] and [H][H]
 * @param {Date|null} targetDate 
 * @returns {Object} { days: ['0','1','2'], hours: ['0','4'] }
 */
export function getCountdownDigits(targetDate) {
  if (!targetDate) {
    return { days: ['0', '0', '0'], hours: ['0', '0'] };
  }

  const now = Date.now();
  const diffMs = targetDate.getTime() - now;

  if (diffMs <= 0) {
    // Already due
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

/**
 * Renders the Ebbinghaus interactive SVG into a container
 * @param {HTMLElement} container 
 * @param {Object} options 
 */
export function renderEbbinghausSVG(container, options = {}) {
  const width = 310;
  const height = 145;
  const padLeft = 28;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Time points (Days): 0 to 30
  const maxDay = 30;

  // Transform coordinates
  const getX = (day) => padLeft + (day / maxDay) * plotW;
  const getY = (retentionPct) => padTop + plotH - (retentionPct / 100) * plotH;

  // 1. Base forgetting curve (No reviews: S = 1.2)
  // R = e^(-t / 1.2)
  let noReviewPath = `M ${getX(0)} ${getY(100)}`;
  for (let d = 0.2; d <= maxDay; d += 0.5) {
    const r = Math.max(5, Math.exp(-d / 1.5) * 100);
    noReviewPath += ` L ${getX(d).toFixed(1)} ${getY(r).toFixed(1)}`;
  }

  // 2. Spaced Repetition saw-tooth curve:
  // Review stages:
  // Stage 0: Day 0 -> Day 1 (S = 1.2) -> drops to ~43%
  // Review 1 at Day 1: jumps to 100%, S = 3.5 -> drops to Day 4 (~42%)
  // Review 2 at Day 4: jumps to 100%, S = 9.0 -> drops to Day 12 (~41%)
  // Review 3 at Day 12: jumps to 100%, S = 28.0 -> drops to Day 30 (~52%)
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
      // vertical recovery jump back to 100%
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

  // Closed area for subtle purple glow fill under spaced curve
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

      <!-- Curve 1: Without Review (Exponential decay without SM-2) -->
      <path d="${noReviewPath}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.6" stroke-dasharray="3,3" />

      <!-- Curve 2: With Spaced Repetition Reviews -->
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

      <!-- Interactive Scrubber Elements (Hidden initially, shown on move) -->
      <g id="interactiveScrubber" opacity="0" pointer-events="none">
        <line id="scrubLine" x1="0" y1="${padTop}" x2="0" y2="${getY(0)}" stroke="#FF8A48" stroke-width="1.2" stroke-dasharray="2,2" />
        <circle id="scrubPoint" cx="0" cy="0" r="4.5" fill="#FFFFFF" stroke="#FF8A48" stroke-width="2" />
      </g>
    </svg>
    <div id="curveTooltip" class="curve-tooltip" style="display: none;"></div>
  `;

  container.innerHTML = svgHTML;

  // Add interactive scrub listener
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

    // Determine retention at this day on the spaced curve
    let retention = 100;
    let stageInfo = 'Initial Learning';
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
