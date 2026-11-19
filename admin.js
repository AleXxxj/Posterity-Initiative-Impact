/* Posterity Impact Initiative — staff area.
   Signs in with Supabase Auth, then manages content through the site's API. */

document.addEventListener('DOMContentLoaded', function () {
    const signin = document.getElementById('adminSignin');
    const app = document.getElementById('adminApp');
    if (!signin || !app) return;

    const KEY = 'pii-admin-session';
    let session = null;
    let config = null;

    const $ = id => document.getElementById(id);
    const note = (id, message, isError) => {
        const el = $(id);
        el.textContent = message || '';
        el.classList.toggle('form-note--error', Boolean(isError));
    };
    const naira = n => '₦' + Number(n).toLocaleString('en-NG');
    const cell = (text, className) => {
        const td = document.createElement('td');
        td.textContent = text == null || text === '' ? '—' : text;
        if (className) td.className = className;
        return td;
    };
    const actionButton = (label, onClick) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'admin__action';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        return btn;
    };

    // Calls our own API with the signed-in user's token
    async function api(path, options) {
        const opts = options || {};
        const res = await fetch(path, {
            method: opts.method || 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token },
            body: opts.body ? JSON.stringify(opts.body) : undefined
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { signOut('Your session has ended. Please sign in again.'); throw new Error('signed out'); }
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');
        return data;
    }

    function showApp() {
        signin.hidden = true;
        app.hidden = false;
        $('adminEmail').textContent = session.email;
        loadOpps();
        loadExpenses();
        loadInbox();
    }

    function signOut(message) {
        session = null;
        try { sessionStorage.removeItem(KEY); } catch (err) { /* storage unavailable */ }
        app.hidden = true;
        signin.hidden = false;
        note('signinNote', message || '');
    }

    // ---------- Sign in ----------
    $('signinForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        note('signinNote', 'Signing in…');
        try {
            if (!config) {
                const res = await fetch('/api/config');
                if (!res.ok) throw new Error('Sign-in is not set up yet.');
                config = await res.json();
            }
            const res = await fetch(config.supabaseUrl + '/auth/v1/token?grant_type=password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: config.supabaseAnonKey },
                body: JSON.stringify({ email: $('signinEmail').value.trim(), password: $('signinPassword').value })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.access_token) throw new Error('That email and password did not match.');

            session = { token: data.access_token, email: (data.user && data.user.email) || $('signinEmail').value.trim() };
            // Confirms this account is on the staff list before showing anything
            await api('/api/expenses');
            try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch (err) { /* storage unavailable */ }
            $('signinPassword').value = '';
            note('signinNote', '');
            showApp();
        } catch (err) {
            if (err.message !== 'signed out') note('signinNote', err.message, true);
            else note('signinNote', 'This account is not on the staff list.', true);
        }
    });
    $('signOut').addEventListener('click', () => signOut(''));

    // ---------- Tabs ----------
    document.querySelectorAll('[data-tab]').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('[data-tab]').forEach(t => t.setAttribute('aria-pressed', String(t === tab)));
            document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
            note('adminNote', '');
        });
    });

    // ---------- Opportunities ----------
    const oppFields = { title: 'oppTitle', organiser: 'oppOrganiser', type: 'oppType', url: 'oppUrl', opens: 'oppOpens', deadline: 'oppDeadline', deadlineNote: 'oppDeadlineNote', checked: 'oppChecked', summary: 'oppSummary', eligibility: 'oppEligibility' };

    function resetOppForm() {
        $('oppForm').reset();
        $('oppId').value = '';
        $('oppChecked').value = new Date().toISOString().slice(0, 10);
        $('oppFormTitle').textContent = 'Add an opportunity';
        $('oppCancel').hidden = true;
    }

    async function loadOpps() {
        const data = await api('/api/opportunities?all=1');
        const rows = $('oppRows');
        rows.textContent = '';
        data.items.forEach(function (item) {
            const tr = document.createElement('tr');
            tr.appendChild(cell(item.title + (item.published ? '' : ' (hidden)') + (item.verified ? '' : ' [auto-listed]')));
            tr.appendChild(cell(item.type));
            tr.appendChild(cell(item.deadline || 'Varies'));
            tr.appendChild(cell(item.checked));
            const actions = document.createElement('td');
            actions.className = 'admin__actions';
            if (!item.verified) {
                actions.appendChild(actionButton('Mark checked', async function () {
                    await api('/api/opportunities?id=' + item.id, { method: 'PUT', body: { verifyOnly: true } });
                    note('adminNote', 'Marked as checked.');
                    loadOpps();
                }));
            }
            actions.appendChild(actionButton('Edit', function () {
                Object.keys(oppFields).forEach(key => { $(oppFields[key]).value = item[key] || ''; });
                $('oppPublished').checked = item.published;
                $('oppId').value = item.id;
                $('oppFormTitle').textContent = 'Edit opportunity';
                $('oppCancel').hidden = false;
                $('oppForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }));
            actions.appendChild(actionButton('Delete', async function () {
                if (!window.confirm('Delete "' + item.title + '"? This cannot be undone.')) return;
                await api('/api/opportunities?id=' + item.id, { method: 'DELETE' });
                note('adminNote', 'Opportunity deleted.');
                loadOpps();
            }));
            tr.appendChild(actions);
            rows.appendChild(tr);
        });
    }

    $('oppDiscover').addEventListener('click', async function () {
        note('adminNote', 'Searching the sources\u2026');
        try {
            const result = await api('/api/cron-discover', { method: 'POST' });
            note('adminNote', result.added ? 'Added ' + result.added + ' new ' + (result.added === 1 ? 'opportunity.' : 'opportunities.') : 'Nothing new was found.');
            loadOpps();
        } catch (err) { note('adminNote', err.message, true); }
    });

    $('oppCancel').addEventListener('click', resetOppForm);
    $('oppForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const body = { published: $('oppPublished').checked };
        Object.keys(oppFields).forEach(key => { body[key] = $(oppFields[key]).value.trim(); });
        const id = $('oppId').value;
        try {
            await api('/api/opportunities' + (id ? '?id=' + id : ''), { method: id ? 'PUT' : 'POST', body: body });
            note('adminNote', id ? 'Opportunity updated.' : 'Opportunity added.');
            resetOppForm();
            loadOpps();
        } catch (err) { note('adminNote', err.message, true); }
    });

    // ---------- Expenses ----------
    async function loadExpenses() {
        const data = await api('/api/expenses');
        const rows = $('expRows');
        rows.textContent = '';
        data.items.forEach(function (item) {
            const tr = document.createElement('tr');
            tr.appendChild(cell(item.spent_on));
            tr.appendChild(cell(item.description));
            tr.appendChild(cell(item.reference));
            tr.appendChild(cell(naira(item.amount), 'num num--out'));
            const actions = document.createElement('td');
            actions.className = 'admin__actions';
            actions.appendChild(actionButton('Delete', async function () {
                if (!window.confirm('Remove this expense from the public ledger?')) return;
                await api('/api/expenses?id=' + item.id, { method: 'DELETE' });
                note('adminNote', 'Expense removed.');
                loadExpenses();
            }));
            tr.appendChild(actions);
            rows.appendChild(tr);
        });
    }

    $('expenseForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        try {
            await api('/api/expenses', { method: 'POST', body: {
                spent_on: $('expDate').value,
                amount: $('expAmount').value,
                description: $('expDescription').value,
                reference: $('expReference').value
            } });
            note('adminNote', 'Expense added to the ledger.');
            $('expenseForm').reset();
            loadExpenses();
        } catch (err) { note('adminNote', err.message, true); }
    });

    // ---------- Messages and subscribers ----------
    async function loadInbox() {
        const data = await api('/api/inbox');

        const list = $('msgList');
        list.textContent = '';
        if (!data.messages.length) {
            const empty = document.createElement('p');
            empty.className = 'table-empty';
            empty.textContent = 'No messages yet.';
            list.appendChild(empty);
        }
        data.messages.forEach(function (m) {
            const article = document.createElement('article');
            article.className = 'update';
            const date = document.createElement('span');
            date.className = 'update__date';
            date.textContent = String(m.created_at).slice(0, 10);
            const body = document.createElement('div');
            const title = document.createElement('h3');
            title.textContent = m.subject || 'No subject';
            const from = document.createElement('p');
            from.textContent = m.name + ' · ' + m.email;
            const message = document.createElement('p');
            message.textContent = m.message;
            message.style.whiteSpace = 'pre-wrap';
            body.append(title, from, message);
            article.append(date, body);
            list.appendChild(article);
        });

        $('subCount').textContent = data.subscribers.length;
        const rows = $('subRows');
        rows.textContent = '';
        data.subscribers.forEach(function (s) {
            const tr = document.createElement('tr');
            tr.appendChild(cell(s.email));
            tr.appendChild(cell(String(s.created_at).slice(0, 10)));
            rows.appendChild(tr);
        });
        $('subCopy').onclick = async function () {
            await navigator.clipboard.writeText(data.subscribers.map(s => s.email).join(', '));
            note('adminNote', 'Addresses copied.');
        };
    }

    // ---------- Restore a session from this browser tab ----------
    resetOppForm();
    try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        if (saved && saved.token) { session = saved; showApp(); }
    } catch (err) { /* storage unavailable */ }
});
