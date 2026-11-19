/* Posterity Impact Initiative — site script
   Shared by every page: navigation, donate dialog, open ledger, share. */

document.addEventListener('DOMContentLoaded', function () {

    // ---------- Mobile navigation ----------
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    if (nav && navToggle) {
        navToggle.addEventListener('click', function () {
            const open = nav.classList.toggle('nav--open');
            navToggle.setAttribute('aria-expanded', String(open));
            navToggle.textContent = open ? 'Close' : 'Menu';
        });
    }

    // Loads live data from the API; if the API is not available (for
    // example on a static host), falls back to the bundled data file.
    function loadData(apiPath, filePath) {
        return fetch(apiPath, { headers: { Accept: 'application/json' } })
            .then(res => res.ok ? res.json() : Promise.reject())
            .catch(() => fetch(filePath, { cache: 'no-store' }).then(res => res.ok ? res.json() : Promise.reject()));
    }

    // Sends a form to the API and reports the outcome in a status line
    function wireForm(formId, noteId, apiPath, collect, successText) {
        const form = document.getElementById(formId);
        if (!form) return;
        const noteEl = document.getElementById(noteId);
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            const payload = collect(form);
            payload.website = form.querySelector('[name="website"]').value;
            noteEl.classList.remove('form-note--error');
            noteEl.textContent = 'Sending\u2026';
            button.disabled = true;
            try {
                const res = await fetch(apiPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(data && data.error && res.status === 400 ? data.error : 'This is not available right now. Please try again later.');
                noteEl.textContent = successText;
                form.reset();
            } catch (err) {
                noteEl.classList.add('form-note--error');
                noteEl.textContent = err.message === 'Failed to fetch' ? 'This is not available right now. Please try again later.' : err.message;
            } finally {
                button.disabled = false;
            }
        });
    }

    wireForm('newsletterForm', 'newsletterNote', '/api/subscribe',
        () => ({ email: document.getElementById('newsletterEmail').value }),
        'Thank you. You are on the list.');
    wireForm('contactForm', 'contactNote', '/api/contact',
        () => ({
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
        }),
        'Thank you. Your message has been sent.');

    // ---------- Open ledger ----------
    function naira(n) {
        return '₦' + Number(n).toLocaleString('en-NG');
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function renderLedger(data) {
        const entries = Array.isArray(data.entries) ? data.entries.slice() : [];
        entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));

        let totalIn = 0;
        let totalOut = 0;
        entries.forEach(entry => {
            const amount = Number(entry.amount) || 0;
            if (entry.type === 'out') { totalOut += amount; } else { totalIn += amount; }
        });

        const fill = (attr, value) => document.querySelectorAll('[' + attr + ']').forEach(node => { node.textContent = value; });
        fill('data-ledger-in', naira(totalIn));
        fill('data-ledger-out', naira(totalOut));
        fill('data-ledger-balance', naira(totalIn - totalOut));
        if (data.updated) setText('ledgerUpdated', 'Last updated ' + data.updated + '.');

        const rows = document.getElementById('ledgerRows');
        if (!rows) return;
        rows.textContent = '';
        entries.forEach(entry => {
            const amount = Number(entry.amount) || 0;
            const isOut = entry.type === 'out';
            const tr = document.createElement('tr');
            [entry.date, entry.description, entry.ref || '—', (isOut ? '−' : '+') + naira(amount)]
                .forEach((text, i) => {
                    const td = document.createElement('td');
                    td.textContent = text;
                    if (i === 3) td.className = 'num ' + (isOut ? 'num--out' : 'num--in');
                    tr.appendChild(td);
                });
            rows.appendChild(tr);
        });

        const empty = document.getElementById('ledgerEmpty');
        const table = document.getElementById('ledgerTable');
        if (empty) empty.hidden = entries.length > 0;
        if (table) table.hidden = entries.length === 0;
    }

    if (document.querySelector('[data-ledger]')) {
        loadData('/api/ledger', 'data/ledger.json')
            .then(renderLedger)
            .catch(() => {
                const empty = document.getElementById('ledgerEmpty');
                if (empty) empty.textContent = 'The ledger could not be loaded just now. Please refresh the page.';
            });
    }

    // ---------- Opportunities ----------
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function parseDay(iso) {
        if (!iso) return null;
        const parts = String(iso).split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    function formatDay(date) {
        return date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
    }

    // Works out whether a listing is open, upcoming, closing soon or closed today
    function oppStatus(item) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deadline = parseDay(item.deadline);
        const opens = parseDay(item.opens);
        const daysLeft = deadline ? Math.round((deadline - today) / 86400000) : null;

        if (deadline && daysLeft < 0) return { key: 'closed', label: 'Closed', sort: 9e15 + deadline.getTime() };
        if (opens && opens > today) return { key: 'upcoming', label: 'Opens ' + formatDay(opens), sort: deadline ? deadline.getTime() : 8e15 };
        if (!deadline) return { key: 'open', label: 'Open', sort: 8e15 };
        if (daysLeft === 0) return { key: 'soon', label: 'Closes today', sort: deadline.getTime() };
        if (daysLeft <= 21) return { key: 'soon', label: daysLeft + (daysLeft === 1 ? ' day left' : ' days left'), sort: deadline.getTime() };
        return { key: 'open', label: 'Open', sort: deadline.getTime() };
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function oppCard(item, compact) {
        const status = oppStatus(item);
        const deadline = parseDay(item.deadline);
        const card = el('article', 'opp opp--' + status.key);

        const when = el('div', 'opp__when');
        if (deadline) {
            when.appendChild(el('span', 'opp__day', String(deadline.getDate())));
            when.appendChild(el('span', 'opp__month', MONTHS[deadline.getMonth()] + ' ' + deadline.getFullYear()));
        } else {
            when.appendChild(el('span', 'opp__month', 'Varies'));
        }
        card.appendChild(when);

        const body = el('div', 'opp__body');
        const meta = el('p', 'opp__meta');
        meta.appendChild(el('span', 'opp__type', item.type));
        meta.appendChild(el('span', 'opp__status', status.label));
        if (item.verified === false) meta.appendChild(el('span', 'opp__auto', 'Auto-listed'));
        body.appendChild(meta);

        const title = el('h3');
        const link = el('a', null, item.title);
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener';
        title.appendChild(link);
        body.appendChild(title);
        body.appendChild(el('p', 'opp__org', item.organiser));

        if (!compact) {
            body.appendChild(el('p', 'opp__text', item.summary));
            if (item.eligibility) {
                const who = el('p', 'opp__text');
                who.appendChild(el('strong', null, 'Who can apply: '));
                who.appendChild(document.createTextNode(item.eligibility));
                body.appendChild(who);
            }
            if (item.deadlineNote) body.appendChild(el('p', 'opp__note', item.deadlineNote + '.'));
            const foot = el('p', 'opp__foot');
            const apply = el('a', 'arrow-link', item.verified === false ? 'Read at source' : 'Official page');
            apply.href = item.url;
            apply.target = '_blank';
            apply.rel = 'noopener';
            foot.appendChild(apply);
            const checked = parseDay(item.checked);
            if (checked) {
                foot.appendChild(el('span', 'opp__checked', item.verified === false
                    ? 'Auto-listed ' + formatDay(checked) + ', not yet checked by our team'
                    : 'Checked by our team ' + formatDay(checked)));
            }
            body.appendChild(foot);
        }
        card.appendChild(body);
        return card;
    }

    const oppList = document.getElementById('oppList');
    const oppHome = document.getElementById('oppHome');
    if (oppList || oppHome) {
        loadData('/api/opportunities', 'data/opportunities.json')
            .then(function (data) {
                const items = (data.items || []).slice()
                    .sort((a, b) => oppStatus(a).sort - oppStatus(b).sort);

                const heroOpp = document.getElementById('heroOpp');
                if (heroOpp) {
                    const live = items.filter(i => oppStatus(i).key !== 'closed');
                    setText('heroOppCount', String(live.length));
                    const next = live.find(i => i.deadline && oppStatus(i).key !== 'upcoming') || live[0];
                    if (next) {
                        setText('heroOppTitle', next.title);
                        setText('heroOppOrg', next.organiser);
                        setText('heroOppDays', oppStatus(next).label);
                        heroOpp.hidden = false;
                    }
                }

                if (oppHome) {
                    const live = items.filter(i => oppStatus(i).key !== 'closed').slice(0, 3);
                    live.forEach(i => oppHome.appendChild(oppCard(i, true)));
                    if (!live.length) oppHome.appendChild(el('p', 'table-empty', 'No open opportunities are listed right now.'));
                }
                if (!oppList) return;

                const filters = document.getElementById('oppFilters');
                const search = document.getElementById('oppSearch');
                const showClosed = document.getElementById('oppShowClosed');
                const checkedOnly = document.getElementById('oppCheckedOnly');
                let activeType = 'All';

                function draw() {
                    const query = search.value.trim().toLowerCase();
                    const shown = items.filter(function (item) {
                        if (activeType !== 'All' && item.type !== activeType) return false;
                        if (!showClosed.checked && oppStatus(item).key === 'closed') return false;
                        if (checkedOnly.checked && item.verified === false) return false;
                        return !query || (item.title + ' ' + item.organiser).toLowerCase().includes(query);
                    });
                    oppList.textContent = '';
                    shown.forEach(item => oppList.appendChild(oppCard(item, false)));
                    document.getElementById('oppEmpty').hidden = shown.length > 0;
                    setText('oppCount', shown.length + (shown.length === 1 ? ' opportunity' : ' opportunities') + ' listed');
                }

                ['All'].concat(Array.from(new Set(items.map(i => i.type))).sort()).forEach(function (type) {
                    const btn = el('button', 'opp-filter', type);
                    btn.type = 'button';
                    btn.setAttribute('aria-pressed', String(type === activeType));
                    btn.addEventListener('click', function () {
                        activeType = type;
                        filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
                        draw();
                    });
                    filters.appendChild(btn);
                });
                search.addEventListener('input', draw);
                showClosed.addEventListener('change', draw);
                checkedOnly.addEventListener('change', draw);
                const updated = parseDay(data.updated);
                if (updated) setText('oppUpdated', 'List last reviewed ' + formatDay(updated) + '.');
                draw();
            })
            .catch(function () {
                const target = oppList || oppHome;
                target.appendChild(el('p', 'table-empty', 'Opportunities could not be loaded just now. Please refresh the page.'));
            });
    }

    // ---------- Light that follows the pointer on glass surfaces ----------
    const canHover = window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;
    if (canHover) {
        document.addEventListener('pointermove', function (e) {
            const surface = e.target.closest && e.target.closest('[data-glow]');
            if (!surface) return;
            const box = surface.getBoundingClientRect();
            surface.style.setProperty('--mx', (e.clientX - box.left) + 'px');
            surface.style.setProperty('--my', (e.clientY - box.top) + 'px');
        });

        // The hero panels tilt slightly towards the pointer
        const stage = document.getElementById('stage');
        const hero = document.querySelector('.hero');
        if (stage && hero) {
            hero.addEventListener('pointermove', function (e) {
                const box = stage.getBoundingClientRect();
                const x = (e.clientX - (box.left + box.width / 2)) / window.innerWidth;
                const y = (e.clientY - (box.top + box.height / 2)) / window.innerHeight;
                stage.style.setProperty('--tx', Math.max(-1, Math.min(1, x * 2)).toFixed(3));
                stage.style.setProperty('--ty', Math.max(-1, Math.min(1, y * 2)).toFixed(3));
            });
            hero.addEventListener('pointerleave', function () {
                stage.style.setProperty('--tx', 0);
                stage.style.setProperty('--ty', 0);
            });
        }
    }

    // ---------- Share ----------
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async function () {
            const url = new URL('index.html', window.location.href).href;
            try {
                if (navigator.share) {
                    await navigator.share({ title: 'Posterity Impact Initiative', url: url });
                } else {
                    await navigator.clipboard.writeText(url);
                    const original = shareBtn.textContent;
                    shareBtn.textContent = 'Link copied';
                    setTimeout(() => { shareBtn.textContent = original; }, 2000);
                }
            } catch (err) { /* share cancelled */ }
        });
    }

    // ---------- Donate dialog + Paystack checkout ----------
    const donateModal = document.getElementById('donateModal');
    if (!donateModal) return;

    const donateSubmit = document.getElementById('donateSubmit');
    const donateError = document.getElementById('donateError');
    const donorName = document.getElementById('donorName');
    const donorEmail = document.getElementById('donorEmail');
    const customAmount = document.getElementById('customAmount');
    const amountButtons = donateModal.querySelectorAll('.modal__amount');
    let selectedAmount = 25000;
    let lastFocus = null;

    function showError(message) {
        donateError.textContent = message;
        donateError.hidden = false;
    }
    function hideError() { donateError.hidden = true; }

    function openModal() {
        lastFocus = document.activeElement;
        donateModal.classList.add('modal--visible');
        document.body.style.overflow = 'hidden';
        const active = donateModal.querySelector('.modal__amount--active') || amountButtons[0];
        active.focus();
    }
    function closeModal() {
        donateModal.classList.remove('modal--visible');
        document.body.style.overflow = '';
        hideError();
        if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll('[data-donate]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });
    });
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && donateModal.classList.contains('modal--visible')) closeModal();
    });

    amountButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            amountButtons.forEach(b => b.classList.remove('modal__amount--active'));
            this.classList.add('modal__amount--active');
            selectedAmount = parseInt(this.getAttribute('data-amount'), 10);
            customAmount.value = '';
            hideError();
        });
    });

    customAmount.addEventListener('input', function () {
        const value = parseInt(this.value, 10);
        if (value && value >= 1000) {
            selectedAmount = value;
            amountButtons.forEach(b => b.classList.remove('modal__amount--active'));
        }
    });

    donateSubmit.addEventListener('click', async function () {
        hideError();

        const custom = parseInt(customAmount.value, 10);
        const finalAmount = custom >= 1000 ? custom : selectedAmount;
        const frequency = donateModal.querySelector('input[name="frequency"]:checked').value;
        const name = donorName.value.trim();
        const email = donorEmail.value.trim();

        // Client-side validation (the server validates again)
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Please enter a valid email address so we can send your receipt.');
            donorEmail.focus();
            return;
        }
        if (!finalAmount || finalAmount < 1000) {
            showError('The minimum donation is ₦1,000.');
            return;
        }

        const originalText = donateSubmit.textContent;
        donateSubmit.disabled = true;
        donateSubmit.textContent = 'Connecting to Paystack…';

        try {
            const res = await fetch('/api/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, amount: finalAmount, frequency: frequency })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong.');

            // Hand the donor over to Paystack's secure checkout page
            window.location.href = data.authorization_url;
        } catch (err) {
            showError('Online giving is not available right now. Please try again later.');
            donateSubmit.disabled = false;
            donateSubmit.textContent = originalText;
        }
    });
});
