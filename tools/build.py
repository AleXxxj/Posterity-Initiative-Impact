#!/usr/bin/env python3
"""Builds the site's HTML pages so every page shares one header and footer.

Edit the page content below, then run:  python3 tools/build.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORG = "Posterity Impact Initiative"

NAV = [
    ("about.html", "About"),
    ("our-work.html", "Our Work"),
    ("opportunities.html", "Opportunities"),
    ("transparency.html", "Transparency"),
    ("news.html", "News"),
    ("get-involved.html", "Get Involved"),
]


def head(title, description):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <link rel="icon" href="assets/logo.png">
    <meta name="theme-color" content="#090511">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@1,8..60,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <a class="skip" href="#main">Skip to content</a>
    <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
"""


def header(current):
    links = "\n".join(
        '                    <li><a class="nav__link" href="%s"%s>%s</a></li>'
        % (href, ' aria-current="page"' if href == current else "", label)
        for href, label in NAV
    )
    return f"""    <header class="site-header">
        <div class="site-header__inner">
            <a class="brand" href="index.html">
                <span class="brand__mark"><img src="assets/logo.png" alt="" width="31" height="33"></span>
                <span class="brand__name"><span>Posterity</span><span>Impact Initiative</span></span>
            </a>
            <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="nav">Menu</button>
            <nav class="nav" id="nav" aria-label="Main">
                <ul class="nav__list">
{links}
                </ul>
                <a class="btn" href="get-involved.html#give" data-donate>Donate</a>
            </nav>
        </div>
    </header>

    <main id="main">
"""


FOOTER = """    </main>

    <footer class="site-footer">
        <div class="wrap">
            <div class="site-footer__top">
                <p class="site-footer__line">Opportunity that <em>outlives us.</em></p>
            </div>
        </div>
        <div class="wrap site-footer__grid">
            <div>
                <p class="site-footer__name">Posterity Impact Initiative</p>
                <p>A Nigerian non-profit working so that the next generation inherits more opportunity than the last.</p>
                <form class="newsletter" id="newsletterForm" novalidate>
                    <label for="newsletterEmail">Get our updates by email</label>
                    <div class="newsletter__row">
                        <input type="email" id="newsletterEmail" class="modal__input" placeholder="you@example.com" autocomplete="email" required>
                        <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                        <button type="submit" class="btn">Subscribe</button>
                    </div>
                    <p class="form-note" id="newsletterNote" role="status"></p>
                </form>
            </div>
            <div>
                <h4>Organisation</h4>
                <ul>
                    <li><a href="about.html">About</a></li>
                    <li><a href="our-work.html">Our Work</a></li>
                    <li><a href="opportunities.html">Opportunities</a></li>
                    <li><a href="transparency.html">Transparency</a></li>
                    <li><a href="news.html">News</a></li>
                </ul>
            </div>
            <div>
                <h4>Take part</h4>
                <ul>
                    <li><a href="get-involved.html#give">Donate</a></li>
                    <li><a href="get-involved.html#partner">Partner with us</a></li>
                    <li><a href="get-involved.html#share">Spread the word</a></li>
                    <li><a href="contact.html">Contact us</a></li>
                </ul>
            </div>
        </div>
        <div class="wrap site-footer__legal">
            <p>&copy; 2026 Posterity Impact Initiative. Registered in Nigeria as Incorporated Trustees, No. 9995471.</p>
        </div>
    </footer>

    <div class="modal" id="donateModal" role="dialog" aria-modal="true" aria-labelledby="donateTitle">
        <div class="modal__overlay" id="modalOverlay"></div>
        <div class="modal__content">
            <button class="modal__close" id="modalClose" aria-label="Close">&times;</button>
            <h2 class="modal__title" id="donateTitle">Make a donation</h2>
            <p class="modal__text">Choose an amount. You will complete payment on Paystack's secure page.</p>

            <div class="modal__amounts">
                <button class="modal__amount" data-amount="5000">&#8358;5,000</button>
                <button class="modal__amount" data-amount="10000">&#8358;10,000</button>
                <button class="modal__amount modal__amount--active" data-amount="25000">&#8358;25,000</button>
                <button class="modal__amount" data-amount="50000">&#8358;50,000</button>
                <button class="modal__amount" data-amount="100000">&#8358;100,000</button>
                <button class="modal__amount" data-amount="250000">&#8358;250,000</button>
            </div>

            <div class="modal__custom">
                <label for="customAmount">Or another amount (&#8358;)</label>
                <input type="number" id="customAmount" class="modal__input" min="1000" inputmode="numeric">
            </div>
            <div class="modal__custom">
                <label for="donorName">Your name</label>
                <input type="text" id="donorName" class="modal__input" autocomplete="name">
            </div>
            <div class="modal__custom">
                <label for="donorEmail">Email address, for your receipt</label>
                <input type="email" id="donorEmail" class="modal__input" autocomplete="email" required>
            </div>

            <div class="modal__frequency">
                <label class="modal__radio"><input type="radio" name="frequency" value="once" checked> One-time</label>
                <label class="modal__radio"><input type="radio" name="frequency" value="monthly"> Monthly</label>
            </div>

            <p class="modal__error" id="donateError" hidden></p>
            <button class="btn btn--block" id="donateSubmit">Continue to payment</button>
            <p class="modal__secure">Payments are processed by Paystack. Card details never reach our servers.</p>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
"""


def page_head(eyebrow, title, lead):
    return f"""        <section class="page-head">
            <div class="wrap">
                <p class="crumbs"><a href="index.html">Home</a><span>/</span>{eyebrow}</p>
                <h1>{title}</h1>
                <p class="lead">{lead}</p>
            </div>
        </section>
"""


CTA = """
        <section class="cta">
            <div class="wrap"><div class="cta__inner" data-glow>
                <h2>Help us build something <em>that lasts.</em></h2>
                <div class="cta__actions">
                    <a class="btn" href="get-involved.html#give" data-donate>Donate</a>
                    <a class="arrow-link" href="get-involved.html">Other ways to help</a>
                </div>
            </div></div>
        </section>
"""

WORK_AREAS = [
    ("Education", "education",
     "Supporting young Nigerians to get into learning and stay in it.",
     "Too many young people leave school early or never get the support that makes learning stick. "
     "Our education work will focus on practical help for learners and the people who teach them."),
    ("Leadership and mentorship", "mentorship",
     "Connecting young people with mentors and practical skills.",
     "Talent is common and guidance is not. We want young people to have someone ahead of them "
     "on the road who can show them how the next step is taken."),
    ("Access to opportunity", "opportunity",
     "Making sure information is never the reason someone misses out.",
     "Scholarships, grants and trainings exist, but they are hard to find and harder to trust. "
     "We want to make real opportunities easier to reach."),
]

PAGES = {}

# ------------------------------------------------------------------ Home
rows = "\n".join(
    f"""                    <a class="row" data-glow href="our-work.html#{slug}">
                        <span class="row__num">0{i}</span>
                        <div>
                            <h3>{name}</h3>
                            <p>{short}</p>
                        </div>
                    </a>"""
    for i, (name, slug, short, _) in enumerate(WORK_AREAS, 1)
)

PAGES["index.html"] = (
    f"{ORG}",
    "Posterity Impact Initiative is a Nigerian non-profit working in education, mentorship and access to opportunity.",
    f"""        <section class="hero">
            <div class="wrap">
                <div class="hero__inner">
                    <div>
                        <span class="chip"><i></i> Nigerian non-profit &middot; Established 2026</span>
                        <h1>Opportunity that <em>outlives us.</em></h1>
                        <p class="lead">
                            Posterity Impact Initiative works in education, mentorship and access to
                            opportunity, for the generation that comes next. Our money and our
                            progress are public from day one.
                        </p>
                        <div class="hero__actions">
                            <a class="btn" href="opportunities.html">Find an opportunity</a>
                            <a class="btn btn--ghost" href="our-work.html">See our work</a>
                        </div>
                    </div>

                    <div class="stage" id="stage" data-ledger>
                        <span class="stage__halo" aria-hidden="true"></span>
                        <div class="stage__tilt">
                            <a class="glass panel panel--ledger" href="transparency.html" data-glow>
                                <p class="panel__head"><span>Public ledger</span><span class="panel__live">Live</span></p>
                                <p class="panel__big" data-ledger-balance>&#8358;0</p>
                                <p class="panel__sub">Current balance, open for anyone to check</p>
                                <div class="panel__row">
                                    <div><small>Received</small><b data-ledger-in>&#8358;0</b></div>
                                    <div><small>Spent</small><b data-ledger-out>&#8358;0</b></div>
                                </div>
                            </a>
                            <a class="glass panel panel--opp" id="heroOpp" href="opportunities.html" data-glow hidden>
                                <p class="panel__head"><span>Next deadline</span><span class="panel__days" id="heroOppDays"></span></p>
                                <h3 id="heroOppTitle"></h3>
                                <p id="heroOppOrg"></p>
                            </a>
                            <p class="glass panel--note"><b id="heroOppCount">0</b> open opportunities, updated every day</p>
                        </div>
                    </div>
                </div>

                <nav class="hero__index" aria-label="Start here">
                    <a href="our-work.html" data-glow><small>01</small><strong>Our work</strong><span>Education, mentorship and access.</span></a>
                    <a href="opportunities.html" data-glow><small>02</small><strong>Opportunities</strong><span>Scholarships and grants, updated daily.</span></a>
                    <a href="transparency.html" data-glow><small>03</small><strong>Transparency</strong><span>Every naira, on public record.</span></a>
                </nav>
            </div>
        </section>

        <section class="section">
            <div class="wrap">
                <p class="statement">
                    We are a young organisation. We would rather show you a short, true record
                    than a long, impressive one, and add to it as the work is done.
                </p>
            </div>
        </section>

        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <span class="eyebrow">Our work</span>
                    <h2>Where we are focusing</h2>
                    <p>Three areas we are building programmes in.</p>
                    <a class="arrow-link" href="our-work.html">More about our work</a>
                </div>
                <div class="rows">
{rows}
                </div>
            </div>
        </section>

        <section class="section" data-opps-home>
            <div class="wrap split">
                <div class="split__head">
                    <span class="eyebrow">Opportunities</span>
                    <h2>Closing soon</h2>
                    <p>Scholarships, grants and trainings open to Nigerians, updated every day.</p>
                    <a class="arrow-link" href="opportunities.html">See all opportunities</a>
                </div>
                <div class="opps" id="oppHome"></div>
            </div>
        </section>

        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <span class="eyebrow">News</span>
                    <h2>Latest from us</h2>
                    <a class="arrow-link" href="news.html">All news</a>
                </div>
                <div class="updates">
                    <article class="update">
                        <span class="update__date">November 2026</span>
                        <div>
                            <h3><a href="news.html#ledger">Our books are open</a></h3>
                            <p>We have published our ledger before receiving a single donation.</p>
                        </div>
                    </article>
                    <article class="update">
                        <span class="update__date">9 November 2026</span>
                        <div>
                            <h3><a href="news.html#registered">We are officially registered</a></h3>
                            <p>Posterity Impact Initiative is now an incorporated non-profit in Nigeria.</p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="band" data-ledger>
            <div class="wrap"><div class="glass band__inner" data-glow>
                <div>
                    <span class="eyebrow">Transparency</span>
                    <h2>Follow the money</h2>
                    <p>Everything we receive and everything we spend is listed on a public ledger.</p>
                    <a class="arrow-link" href="transparency.html">View the full ledger</a>
                </div>
                <div class="figures">
                    <div class="figure"><span class="figure__label">Received</span><span class="figure__value" data-ledger-in>&#8358;0</span></div>
                    <div class="figure"><span class="figure__label">Spent</span><span class="figure__value" data-ledger-out>&#8358;0</span></div>
                    <div class="figure"><span class="figure__label">Balance</span><span class="figure__value" data-ledger-balance>&#8358;0</span></div>
                </div>
            </div></div>
        </section>
{CTA}""",
)

# ------------------------------------------------------------------ About
PAGES["about.html"] = (
    f"About | {ORG}",
    "Who we are, what we believe and how Posterity Impact Initiative is governed.",
    page_head("About", "Who we are",
              "A Nigerian non-profit founded in 2026 to widen opportunity for the next generation.")
    + f"""
        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <h2>Our story</h2>
                </div>
                <div class="prose">
                    <p>
                        Posterity Impact Initiative was registered in November 2026. The name says what
                        we care about: posterity, the people who come after us, and whether they inherit
                        more opportunity than we did.
                    </p>
                    <p>
                        We are at the beginning. Our first programmes are being planned, and we will
                        describe them on this site as they take shape, along with what they cost and
                        what they achieve.
                    </p>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <h2>What we believe</h2>
                </div>
                <ul class="plain-list">
                    <li><strong>Openness</strong><span>An organisation that asks for public trust should keep public records.</span></li>
                    <li><strong>Dignity</strong><span>The people we work with are partners in the work, never props for it.</span></li>
                    <li><strong>Posterity</strong><span>We measure ourselves by what is still standing after we are gone.</span></li>
                </ul>
            </div>
        </section>

        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <h2>Governance</h2>
                </div>
                <div class="prose">
                    <p>
                        Posterity Impact Initiative is governed by a board of trustees, who are
                        responsible for its direction and for how its funds are used.
                    </p>
                    <p>
                        Our registration details and financial records are on the
                        <a href="transparency.html">Transparency</a> page.
                    </p>
                </div>
            </div>
        </section>
{CTA}""",
)

# ------------------------------------------------------------------ Our Work
areas = "\n".join(
    f"""                <article class="way" id="{slug}">
                    <div>
                        <span class="eyebrow">0{i}</span>
                        <h2>{name}</h2>
                    </div>
                    <div class="prose">
                        <p>{long}</p>
                    </div>
                </article>"""
    for i, (name, slug, _, long) in enumerate(WORK_AREAS, 1)
)

PAGES["our-work.html"] = (
    f"Our Work | {ORG}",
    "The areas Posterity Impact Initiative is building programmes in: education, mentorship and access to opportunity.",
    page_head("Our work", "What we are setting out to do",
              "We are building programmes in three areas. Details will be added here as each one begins.")
    + f"""
        <section class="section">
            <div class="wrap ways">
{areas}
            </div>
        </section>

        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <h2>How we will report</h2>
                </div>
                <div class="prose">
                    <p>
                        When a programme starts, it will have its own entry here with what it sets out
                        to do, what it costs and what happened. Its spending will appear on the
                        <a href="transparency.html">public ledger</a>.
                    </p>
                </div>
            </div>
        </section>
{CTA}""",
)

# ------------------------------------------------------------------ Opportunities
PAGES["opportunities.html"] = (
    f"Opportunities | {ORG}",
    "Scholarships, grants, fellowships and trainings open to Nigerians, updated every day.",
    page_head("Opportunities", "Open opportunities for Nigerians",
              "Scholarships, grants, fellowships and trainings, updated every day. Listings our team has confirmed are marked as checked.")
    + """
        <section class="section" data-opps>
            <div class="wrap">
                <div class="opp-tools">
                    <div class="opp-filters" id="oppFilters" role="group" aria-label="Filter by type"></div>
                    <label class="opp-search">
                        <span class="sr-only">Search opportunities</span>
                        <input type="search" id="oppSearch" class="modal__input" placeholder="Search by name or organiser">
                    </label>
                </div>
                <p class="table-note" id="oppCount" aria-live="polite"></p>
                <div class="opps" id="oppList"></div>
                <p class="table-empty" id="oppEmpty" hidden>No opportunities match that search.</p>
                <div class="opp-toggles">
                    <label class="opp-closed"><input type="checkbox" id="oppCheckedOnly"> Only show listings our team has checked</label>
                    <label class="opp-closed"><input type="checkbox" id="oppShowClosed"> Show closed opportunities</label>
                </div>
                <p class="table-note" id="oppUpdated"></p>
            </div>
        </section>

        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <h2>Before you apply</h2>
                </div>
                <ul class="plain-list">
                    <li><strong>We do not run these programmes</strong><span>Each listing belongs to the organisation named on it. Apply only on its official page, which we link to.</span></li>
                    <li><strong>Know what "Auto-listed" means</strong><span>New listings are gathered automatically each day from other opportunity sites. Until our team confirms one, it is marked Auto-listed and links to the site that reported it.</span></li>
                    <li><strong>Check the date yourself</strong><span>Deadlines change. Confirm the details on the organiser's own website before you apply.</span></li>
                    <li><strong>Never pay to apply through us</strong><span>We charge nothing and will never ask you for money or personal documents.</span></li>
                </ul>
            </div>
        </section>
""",
)

# ------------------------------------------------------------------ Transparency
PAGES["transparency.html"] = (
    f"Transparency | {ORG}",
    "The public ledger and registration details of Posterity Impact Initiative.",
    page_head("Transparency", "Our records are public",
              "What we receive, what we spend and how to check that we are who we say we are.")
    + """
        <section class="section" id="ledger" data-ledger>
            <div class="wrap">
                <span class="eyebrow">Ledger</span>
                <h2>Money in and money out</h2>
                <div class="totals">
                    <div class="total"><span class="total__label">Received</span><span class="total__value" data-ledger-in>&#8358;0</span></div>
                    <div class="total"><span class="total__label">Spent</span><span class="total__value" data-ledger-out>&#8358;0</span></div>
                    <div class="total"><span class="total__label">Balance</span><span class="total__value" data-ledger-balance>&#8358;0</span></div>
                </div>
                <div class="table-wrap">
                    <table id="ledgerTable" hidden>
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Description</th>
                                <th scope="col">Reference</th>
                                <th scope="col" class="num">Amount</th>
                            </tr>
                        </thead>
                        <tbody id="ledgerRows"></tbody>
                    </table>
                    <p class="table-empty" id="ledgerEmpty">No transactions have been recorded yet.</p>
                </div>
                <p class="table-note" id="ledgerUpdated"></p>
            </div>
        </section>

        <section class="section" id="registration">
            <div class="wrap split">
                <div class="split__head">
                    <span class="eyebrow">Registration</span>
                    <h2>Legal status</h2>
                    <p>We are registered with Nigeria's Corporate Affairs Commission.</p>
                </div>
                <div>
                    <dl class="facts">
                        <div><dt>Registered name</dt><dd>Posterity Impact Initiative</dd></div>
                        <div><dt>Type</dt><dd>Incorporated Trustees</dd></div>
                        <div><dt>Registration number</dt><dd>9995471</dd></div>
                        <div><dt>Date of incorporation</dt><dd>9 November 2026</dd></div>
                    </dl>
                    <ol class="steps">
                        <li>Go to the Commission's public register at <a class="text-link" href="https://search.cac.gov.ng" target="_blank" rel="noopener">search.cac.gov.ng</a>.</li>
                        <li>Search for our name or registration number.</li>
                        <li>Compare the record with the details above.</li>
                    </ol>
                </div>
            </div>
        </section>
""",
)

# ------------------------------------------------------------------ News
PAGES["news.html"] = (
    f"News | {ORG}",
    "News and updates from Posterity Impact Initiative.",
    page_head("News", "News and updates", "What we have been doing, most recent first.")
    + """
        <section class="section">
            <div class="wrap">
                <div class="updates">
                    <article class="update" id="ledger">
                        <span class="update__date">November 2026</span>
                        <div>
                            <h3>Our books are open</h3>
                            <p>
                                We have published our ledger before receiving a single donation, so the
                                record is complete from the first naira. Every amount we receive and
                                every payment we make will be listed there.
                            </p>
                            <p><a class="arrow-link" href="transparency.html">View the ledger</a></p>
                        </div>
                    </article>
                    <article class="update" id="registered">
                        <span class="update__date">9 November 2026</span>
                        <div>
                            <h3>We are officially registered</h3>
                            <p>
                                Posterity Impact Initiative has been registered with the Corporate
                                Affairs Commission as Incorporated Trustees. This gives the organisation
                                its own legal standing and lets us begin our work properly.
                            </p>
                            <p><a class="arrow-link" href="transparency.html#registration">Registration details</a></p>
                        </div>
                    </article>
                </div>
            </div>
        </section>
""",
)

# ------------------------------------------------------------------ Get Involved
PAGES["get-involved.html"] = (
    f"Get Involved | {ORG}",
    "Donate to, partner with or support Posterity Impact Initiative.",
    page_head("Get involved", "Ways to take part",
              "We are just starting, which makes this the moment when support counts most.")
    + """
        <section class="section">
            <div class="wrap ways">
                <article class="way" id="give">
                    <div><h2>Give</h2></div>
                    <div>
                        <p>
                            Make a one-time or monthly donation. Payment is handled by Paystack, and
                            your gift is recorded on our public ledger.
                        </p>
                        <a class="btn" href="#give" data-donate>Donate</a>
                    </div>
                </article>
                <article class="way" id="partner">
                    <div><h2>Partner with us</h2></div>
                    <div>
                        <p>
                            We welcome conversations with companies, foundations, schools and community
                            groups whose work overlaps with ours. Partners can see our registration
                            and financial records before committing to anything.
                        </p>
                        <a class="btn btn--ghost" href="contact.html">Start a conversation</a>
                    </div>
                </article>
                <article class="way" id="share">
                    <div><h2>Spread the word</h2></div>
                    <div>
                        <p>Tell someone about us. For a new organisation, an introduction is worth a great deal.</p>
                        <button type="button" class="btn btn--ghost" id="shareBtn">Share this site</button>
                    </div>
                </article>
            </div>
        </section>
""",
)

# ------------------------------------------------------------------ Thank you
PAGES["thanks.html"] = (
    f"Thank you | {ORG}",
    "Thank you for your donation.",
    """        <section class="thanks">
            <div class="glass thanks__card">
                <span class="eyebrow">Payment received</span>
                <h1>Thank you.</h1>
                <p>A receipt is on its way to your email. Your donation will be recorded on our public ledger.</p>
                <a class="btn" href="index.html">Back to home</a>
                <p class="thanks__ref" id="txRef"></p>
            </div>
        </section>
        <script>
            // Paystack appends ?trxref=...&reference=... to the callback URL
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('reference') || params.get('trxref');
            if (ref) document.getElementById('txRef').textContent = 'Reference: ' + ref;
        </script>
""",
)

# ------------------------------------------------------------------ Contact
PAGES["contact.html"] = (
    f"Contact | {ORG}",
    "Send a message to Posterity Impact Initiative.",
    page_head("Contact", "Talk to us",
              "Questions, partnership ideas or corrections to a listing. We read every message.")
    + """
        <section class="section">
            <div class="wrap split">
                <div class="split__head">
                    <h2>Send a message</h2>
                    <p>Tell us who you are and what you have in mind, and we will reply by email.</p>
                </div>
                <form class="glass form" id="contactForm" novalidate>
                    <div class="form__grid">
                        <div class="modal__custom">
                            <label for="contactName">Your name</label>
                            <input type="text" id="contactName" class="modal__input" autocomplete="name" required>
                        </div>
                        <div class="modal__custom">
                            <label for="contactEmail">Email address</label>
                            <input type="email" id="contactEmail" class="modal__input" autocomplete="email" required>
                        </div>
                    </div>
                    <div class="modal__custom">
                        <label for="contactSubject">Subject</label>
                        <input type="text" id="contactSubject" class="modal__input">
                    </div>
                    <div class="modal__custom">
                        <label for="contactMessage">Message</label>
                        <textarea id="contactMessage" class="modal__input" rows="6" required></textarea>
                    </div>
                    <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
                    <button type="submit" class="btn">Send message</button>
                    <p class="form-note" id="contactNote" role="status"></p>
                </form>
            </div>
        </section>
""",
)

# ------------------------------------------------------------------ Admin
PAGES["admin.html"] = (
    f"Admin | {ORG}",
    "Staff area.",
    """        <section class="section admin" id="admin">
            <div class="wrap">
                <div class="glass form admin__signin" id="adminSignin">
                    <span class="eyebrow">Staff area</span>
                    <h1>Sign in</h1>
                    <form id="signinForm" novalidate>
                        <div class="modal__custom">
                            <label for="signinEmail">Email address</label>
                            <input type="email" id="signinEmail" class="modal__input" autocomplete="username" required>
                        </div>
                        <div class="modal__custom">
                            <label for="signinPassword">Password</label>
                            <input type="password" id="signinPassword" class="modal__input" autocomplete="current-password" required>
                        </div>
                        <button type="submit" class="btn btn--block">Sign in</button>
                        <p class="form-note" id="signinNote" role="status"></p>
                    </form>
                </div>

                <div id="adminApp" hidden>
                    <div class="admin__bar">
                        <div>
                            <span class="eyebrow">Staff area</span>
                            <h1>Manage the site</h1>
                        </div>
                        <div class="admin__who"><span id="adminEmail"></span><button type="button" class="btn btn--ghost" id="signOut">Sign out</button></div>
                    </div>

                    <div class="opp-filters admin__tabs" role="tablist">
                        <button type="button" class="opp-filter" data-tab="opps" aria-pressed="true">Opportunities</button>
                        <button type="button" class="opp-filter" data-tab="expenses" aria-pressed="false">Expenses</button>
                        <button type="button" class="opp-filter" data-tab="messages" aria-pressed="false">Messages</button>
                        <button type="button" class="opp-filter" data-tab="subscribers" aria-pressed="false">Subscribers</button>
                    </div>
                    <p class="form-note" id="adminNote" role="status"></p>

                    <div data-panel="opps">
                        <form class="glass form" id="oppForm" novalidate>
                            <h2 id="oppFormTitle">Add an opportunity</h2>
                            <input type="hidden" id="oppId">
                            <div class="form__grid">
                                <div class="modal__custom"><label for="oppTitle">Title</label><input type="text" id="oppTitle" class="modal__input" required></div>
                                <div class="modal__custom"><label for="oppOrganiser">Organiser</label><input type="text" id="oppOrganiser" class="modal__input" required></div>
                                <div class="modal__custom"><label for="oppType">Type</label>
                                    <select id="oppType" class="modal__input">
                                        <option>Scholarship</option><option>Grant</option><option>Fellowship</option>
                                        <option>Training</option><option>Competition</option><option>Job</option>
                                    </select>
                                </div>
                                <div class="modal__custom"><label for="oppUrl">Official page link</label><input type="url" id="oppUrl" class="modal__input" placeholder="https://" required></div>
                                <div class="modal__custom"><label for="oppOpens">Opens (optional)</label><input type="date" id="oppOpens" class="modal__input"></div>
                                <div class="modal__custom"><label for="oppDeadline">Deadline (leave empty if it varies)</label><input type="date" id="oppDeadline" class="modal__input"></div>
                                <div class="modal__custom"><label for="oppDeadlineNote">Deadline note (optional)</label><input type="text" id="oppDeadlineNote" class="modal__input"></div>
                                <div class="modal__custom"><label for="oppChecked">Date you checked it</label><input type="date" id="oppChecked" class="modal__input" required></div>
                            </div>
                            <div class="modal__custom"><label for="oppSummary">Summary</label><textarea id="oppSummary" class="modal__input" rows="3" required></textarea></div>
                            <div class="modal__custom"><label for="oppEligibility">Who can apply</label><textarea id="oppEligibility" class="modal__input" rows="2"></textarea></div>
                            <label class="opp-closed"><input type="checkbox" id="oppPublished" checked> Show on the website</label>
                            <div class="form__actions">
                                <button type="submit" class="btn" id="oppSave">Save opportunity</button>
                                <button type="button" class="btn btn--ghost" id="oppCancel" hidden>Cancel edit</button>
                            </div>
                        </form>
                        <div class="glass form admin__discover">
                            <div>
                                <h2>Automatic search</h2>
                                <p class="form-hint">Runs every morning. Auto-listed entries stay labelled until you mark them checked.</p>
                            </div>
                            <button type="button" class="btn btn--ghost" id="oppDiscover">Search for new ones now</button>
                        </div>
                        <div class="glass table-wrap admin__table"><table><thead><tr><th>Title</th><th>Type</th><th>Deadline</th><th>Checked</th><th></th></tr></thead><tbody id="oppRows"></tbody></table></div>
                    </div>

                    <div data-panel="expenses" hidden>
                        <form class="glass form" id="expenseForm" novalidate>
                            <h2>Record an expense</h2>
                            <p class="form-hint">This appears on the public ledger straight away.</p>
                            <div class="form__grid">
                                <div class="modal__custom"><label for="expDate">Date spent</label><input type="date" id="expDate" class="modal__input" required></div>
                                <div class="modal__custom"><label for="expAmount">Amount (&#8358;)</label><input type="number" id="expAmount" class="modal__input" min="1" step="0.01" required></div>
                                <div class="modal__custom"><label for="expDescription">What it was spent on</label><input type="text" id="expDescription" class="modal__input" required></div>
                                <div class="modal__custom"><label for="expReference">Receipt or reference (optional)</label><input type="text" id="expReference" class="modal__input"></div>
                            </div>
                            <button type="submit" class="btn">Add to ledger</button>
                        </form>
                        <div class="glass table-wrap admin__table"><table><thead><tr><th>Date</th><th>Description</th><th>Reference</th><th class="num">Amount</th><th></th></tr></thead><tbody id="expRows"></tbody></table></div>
                    </div>

                    <div data-panel="messages" hidden>
                        <div class="updates" id="msgList"></div>
                    </div>

                    <div data-panel="subscribers" hidden>
                        <div class="glass form">
                            <h2><span id="subCount">0</span> subscribers</h2>
                            <button type="button" class="btn btn--ghost" id="subCopy">Copy all addresses</button>
                        </div>
                        <div class="glass table-wrap admin__table"><table><thead><tr><th>Email</th><th>Joined</th></tr></thead><tbody id="subRows"></tbody></table></div>
                    </div>
                </div>
            </div>
        </section>
""",
)

for filename, (title, description, body) in PAGES.items():
    html = head(title, description) + header(filename) + body + FOOTER
    if filename == "admin.html":
        html = html.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n    <meta name="viewport"', 1)
        html = html.replace('<script src="script.js"></script>', '<script src="script.js"></script>\n    <script src="admin.js"></script>')
    (ROOT / filename).write_text(html, encoding="utf-8")
    print("built", filename)
