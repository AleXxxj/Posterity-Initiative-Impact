// /api/expenses  (admin only; the public sees expenses through /api/ledger)
//   GET            list
//   POST           record an expense
//   DELETE ?id=... remove one entered by mistake
const { db, getAdmin, endpoint, text, isDate } = require('./_lib');

const UUID = /^[0-9a-f-]{36}$/i;

module.exports = endpoint(async (req, res) => {
  const admin = await getAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Please sign in.' });

  if (req.method === 'GET') {
    const rows = await db('expenses?select=*&order=spent_on.desc&limit=1000');
    return res.status(200).json({ items: rows });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const description = text(body.description, 300);
    const amount = Number(body.amount);
    if (!description) return res.status(400).json({ error: 'Describe what the money was spent on.' });
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Enter an amount above zero.' });
    if (!isDate(body.spent_on)) return res.status(400).json({ error: 'Enter the date the money was spent.' });

    const created = await db('expenses', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        spent_on: body.spent_on,
        description,
        amount,
        reference: text(body.reference, 120),
        created_by: admin.email,
      },
    });
    return res.status(201).json({ item: created[0] });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '');
    if (!UUID.test(id)) return res.status(400).json({ error: 'Missing or invalid id.' });
    await db(`expenses?id=eq.${id}`, { method: 'DELETE' });
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
