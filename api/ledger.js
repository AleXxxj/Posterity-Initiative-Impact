// GET /api/ledger
// The public ledger: every successful donation and every expense.
// Donor names and emails are never included.
const { db, endpoint } = require('./_lib');

module.exports = endpoint(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [donations, expenses] = await Promise.all([
    db('donations?status=eq.success&select=reference,amount,frequency,paid_at&order=paid_at.desc&limit=1000'),
    db('expenses?select=id,spent_on,description,amount,reference&order=spent_on.desc&limit=1000'),
  ]);

  const entries = [
    ...donations.map(d => ({
      date: String(d.paid_at || '').slice(0, 10),
      type: 'in',
      description: d.frequency === 'monthly' ? 'Monthly donation' : 'Donation',
      amount: Number(d.amount),
      ref: d.reference,
    })),
    ...expenses.map(e => ({
      date: e.spent_on,
      type: 'out',
      description: e.description,
      amount: Number(e.amount),
      ref: e.reference || null,
    })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({ updated: new Date().toISOString().slice(0, 10), live: true, entries });
});
