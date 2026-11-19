// ============================================================
// Finds new opportunities in public feeds and turns each one
// into a listing. Used by /api/cron-discover.
//
// Nothing here is checked by a person. To keep the board
// trustworthy, a feed item is only listed when it:
//   - comes from one of the sources named below,
//   - states a deadline we can read, and that date is ahead,
//   - is open to Nigerians or Africans, and
//   - shows none of the usual signs of a scam.
// ============================================================

const SOURCES = [
  { name: 'Opportunities for Africans', url: 'https://www.opportunitiesforafricans.com/feed/', africaFocused: true },
  { name: 'Opportunities for Youth', url: 'https://opportunitiesforyouth.org/feed/', africaFocused: false },
  { name: 'Scholars4Dev', url: 'https://www.scholars4dev.com/feed/', africaFocused: false },
];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DAY_FIRST = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH}\\.?,?\\s+(20\\d{2})`, 'i');
const MONTH_FIRST = new RegExp(`${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})`, 'i');

const RELEVANT = /\b(nigeria|nigerian|nigerians|africa|african|africans|developing countr|international students|all countries|all nationalities|worldwide|global)\b/i;
const SUSPICIOUS = /(processing|registration|application|form)\s+fee\s+(of|is)\b|pay\s+(a|the|an)\s+\w*\s*(fee|sum|amount)|whatsapp|telegram|guaranteed (visa|admission|job)|bit\.ly|tinyurl/i;
const ROUNDUP = /^\s*\d+\+?\s|\broundup\b|\btop \d+\b|\blist of\b/i;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: '...' };

function decode(text) {
  return String(text)
    .replace(/&#(\d+);/g, (m, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (m, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => (name.toLowerCase() in ENTITIES ? ENTITIES[name.toLowerCase()] : m));
}

// Feed markup -> plain text
function plain(markup) {
  return decode(decode(String(markup || '').replace(/<!\[CDATA\[|\]\]>/g, '')).replace(/<[^>]*>/g, ' '))
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ').trim();
}

function tag(item, name) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? match[1] : '';
}

function parseFeed(xml) {
  return (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []).map(item => ({
    title: plain(tag(item, 'title')),
    link: plain(tag(item, 'link')),
    guid: plain(tag(item, 'guid')),
    description: plain(tag(item, 'description')),
    content: plain(tag(item, 'content:encoded')),
    categories: (item.match(/<category[^>]*>[\s\S]*?<\/category>/gi) || []).map(c => plain(c)),
  }));
}

function toIsoDate(year, monthName, day) {
  const month = MONTHS.findIndex(m => m.startsWith(monthName.toLowerCase().slice(0, 3)));
  const date = new Date(Date.UTC(Number(year), month, Number(day)));
  if (month < 0 || date.getUTCDate() !== Number(day)) return null;
  return date.toISOString().slice(0, 10);
}

// Reads the date that follows the word "deadline", if there is one
function findDeadline(text) {
  const pattern = /deadline/gi;
  let hit;
  while ((hit = pattern.exec(text))) {
    // Look only as far as the end of the sentence that mentions the deadline
    const window = text.slice(hit.index, hit.index + 70).split(/[.!?]\s+(?=[A-Z])/)[0];
    const dayFirst = window.match(DAY_FIRST);
    const monthFirst = window.match(MONTH_FIRST);
    const pick = dayFirst && monthFirst ? (dayFirst.index <= monthFirst.index ? 'd' : 'm') : dayFirst ? 'd' : monthFirst ? 'm' : null;
    const iso = pick === 'd' ? toIsoDate(dayFirst[3], dayFirst[2], dayFirst[1])
      : pick === 'm' ? toIsoDate(monthFirst[3], monthFirst[1], monthFirst[2]) : null;
    if (iso) return iso;
  }
  return null;
}

function guessType(text) {
  const t = text.toLowerCase();
  if (/scholarship|bursar|tuition/.test(t)) return 'Scholarship';
  if (/fellowship/.test(t)) return 'Fellowship';
  if (/\bgrant|\bfund\b|funding|seed capital/.test(t)) return 'Grant';
  if (/prize|award|competition|challenge|contest|hackathon/.test(t)) return 'Competition';
  if (/internship|\bjobs?\b|vacanc|recruit|roster|graduate trainee/.test(t)) return 'Job';
  return 'Training';
}

function shorten(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '...';
}

// One feed item -> a listing row, or the reason it was left out
function toListing(item, source, today) {
  const body = `${item.title} ${item.description} ${item.content}`;
  const link = item.link || item.guid;

  if (!item.title || !/^https?:\/\//i.test(link)) return { skip: 'no link' };
  if (ROUNDUP.test(item.title) || item.categories.some(c => /roundup/i.test(c))) return { skip: 'roundup' };
  if (SUSPICIOUS.test(body)) return { skip: 'suspicious wording' };
  if (!source.africaFocused && !RELEVANT.test(`${body} ${item.categories.join(' ')}`)) return { skip: 'not open to Nigerians' };

  const deadline = findDeadline(body);
  if (!deadline) return { skip: 'no readable deadline' };
  const limit = new Date(Date.parse(today) + 548 * 86400000).toISOString().slice(0, 10);
  if (deadline <= today) return { skip: 'deadline passed' };
  if (deadline > limit) return { skip: 'deadline too far ahead' };

  // The feed's own summary, minus its "The post ... appeared first on ..." trailer
  const summary = item.description.replace(/\s*(The post|Continue reading|Read more)\b.*$/i, '').replace(/\[\s*(\.\.\.|&hellip;)\s*\]\s*$/, '').trim();

  return {
    row: {
      title: shorten(item.title, 110),
      organiser: `Via ${source.name}`,
      type: guessType(`${item.title} ${item.categories.join(' ')}`),
      summary: shorten(summary || item.title, 200),
      eligibility: null,
      url: link,
      opens: null,
      deadline,
      deadline_note: null,
      checked: today,
      published: true,
      verified: false,
      source: source.name,
      source_id: link,
    },
  };
}

async function fetchFeed(source) {
  const res = await fetch(source.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FeedReader/1.0)', Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text());
}

// Reads every source and returns the listings worth adding, plus a report
async function discover(today) {
  const rows = [];
  const report = [];
  const results = await Promise.allSettled(SOURCES.map(fetchFeed));

  results.forEach((result, i) => {
    const source = SOURCES[i];
    if (result.status === 'rejected') {
      report.push({ source: source.name, error: String(result.reason.message || result.reason) });
      return;
    }
    const skipped = {};
    let kept = 0;
    result.value.forEach(item => {
      const { row, skip } = toListing(item, source, today);
      if (row) { rows.push(row); kept += 1; } else { skipped[skip] = (skipped[skip] || 0) + 1; }
    });
    report.push({ source: source.name, read: result.value.length, kept, skipped });
  });

  return { rows, report };
}

module.exports = { discover, toListing, findDeadline, parseFeed, guessType, SOURCES };
