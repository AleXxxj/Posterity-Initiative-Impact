// /api/opportunities
//   GET              public list of published opportunities
//   GET ?all=1       admin: includes unpublished
//   POST             admin: create
//   PUT ?id=...      admin: update
//   DELETE ?id=...   admin: remove
const { db, getAdmin, endpoint, text, isDate, isHttpUrl } = require('./_lib');

const TYPES = ['Scholarship', 'Grant', 'Fellowship', 'Training', 'Competition', 'Job'];
const today = () => new Date().toISOString().slice(0, 10);
const UUID = /^[0-9a-f-]{36}$/i;

// Database row -> the shape the website uses
function toPublic(row) {
  return {
    id: row.id,
    title: row.title,
    organiser: row.organiser,
    type: row.type,
    summary: row.summary,
    eligibility: row.eligibility,
    url: row.url,
    opens: row.opens,
    deadline: row.deadline,
    deadlineNote: row.deadline_note,
    checked: row.checked,
    published: row.published,
    verified: row.verified !== false,
    source: row.source || null,
  };
}

// Validates admin input; returns { row } or { error }
function fromInput(body) {
  const title = text(body.title, 200);
  const organiser = text(body.organiser, 200);
  const summary = text(body.summary, 1000);
  if (!title || !organiser || !summary) return { error: 'Title, organiser and summary are required.' };
  if (!TYPES.includes(body.type)) return { error: 'Choose a valid type.' };
  if (!isHttpUrl(body.url)) return { error: 'The official link must be a full web address.' };
  if (!isDate(body.checked)) return { error: 'Enter the date you checked this listing.' };
  if (body.deadline && !isDate(body.deadline)) return { error: 'The deadline is not a valid date.' };
  if (body.opens && !isDate(body.opens)) return { error: 'The opening date is not a valid date.' };

  return {
    row: {
      title,
      organiser,
      type: body.type,
      summary,
      eligibility: text(body.eligibility, 1000),
      url: body.url.trim(),
      opens: body.opens || null,
      deadline: body.deadline || null,
      deadline_note: text(body.deadlineNote, 300),
      checked: body.checked,
      published: body.published !== false,
      verified: true, // saved by a person, so it counts as checked
    },
  };
}

module.exports = endpoint(async (req, res) => {
  if (req.method === 'GET') {
    const wantsAll = req.query.all === '1';
    if (wantsAll && !(await getAdmin(req))) return res.status(401).json({ error: 'Please sign in.' });

    const filter = wantsAll ? '' : 'published=eq.true&';
    const rows = await db(`opportunities?${filter}select=*&order=deadline.asc.nullslast&limit=500`);
    if (!wantsAll) res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ updated: new Date().toISOString().slice(0, 10), live: true, items: rows.map(toPublic) });
  }

  const admin = await getAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Please sign in.' });

  if (req.method === 'POST') {
    const { row, error } = fromInput(req.body || {});
    if (error) return res.status(400).json({ error });
    const created = await db('opportunities', { method: 'POST', body: row, prefer: 'return=representation' });
    return res.status(201).json({ item: toPublic(created[0]) });
  }

  const id = String(req.query.id || '');
  if (!UUID.test(id)) return res.status(400).json({ error: 'Missing or invalid id.' });

  if (req.method === 'PUT') {
    // "Mark as checked": confirm an auto-listed entry without retyping it
    if (req.body && req.body.verifyOnly) {
      const marked = await db(`opportunities?id=eq.${id}`, { method: 'PATCH', body: { verified: true, checked: today() }, prefer: 'return=representation' });
      if (!marked.length) return res.status(404).json({ error: 'Not found.' });
      return res.status(200).json({ item: toPublic(marked[0]) });
    }
    const { row, error } = fromInput(req.body || {});
    if (error) return res.status(400).json({ error });
    const updated = await db(`opportunities?id=eq.${id}`, { method: 'PATCH', body: row, prefer: 'return=representation' });
    if (!updated.length) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json({ item: toPublic(updated[0]) });
  }

  if (req.method === 'DELETE') {
    await db(`opportunities?id=eq.${id}`, { method: 'DELETE' });
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
