"""End-to-end journey tests for the ARLibrary app.

Covers state-changing flows and cross-page data consistency — the things a
page-by-page visual review cannot catch: does a borrow actually reach My
Books, does an admin edit keep the shelf it was given, does a help-centre
message actually arrive in the admin inbox.

Prerequisites:
    pip install playwright
    npm run dev          # server must be listening on BASE

Run:
    python3 tests/e2e.py

Exits non-zero if any assertion fails, so it can gate a build.
Override the browser binary with PLAYWRIGHT_CHROMIUM if yours lives
elsewhere; downloads and screenshots go to a temp dir.
"""
import os, sys, json, tempfile, traceback
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE_URL', 'http://localhost:3000')
CHROME = os.environ.get('PLAYWRIGHT_CHROMIUM', '/opt/pw-browsers/chromium')
OUT = tempfile.mkdtemp(prefix='arlibrary-e2e-')

STUDENT = {"id": "u2", "name": "سارة أحمد", "email": "sarah@example.com", "role": "student",
           "borrowedBooks": ["7"], "totalReadCount": 5, "points": 85, "badges": []}
ADMIN = {"id": "a1", "name": "مدير النظام", "email": "admin@lib.om", "role": "admin",
         "borrowedBooks": [], "totalReadCount": 0, "points": 0, "badges": []}

results = []


def record(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"\n          {detail}" if detail else ""))


def new_page(browser, user=STUDENT, lang='ar', width=1280, height=900):
    ctx = browser.new_context(viewport={'width': width, 'height': height},
                              permissions=['camera'], accept_downloads=True)
    page = ctx.new_page()
    page.set_default_timeout(15000)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e).split('\n')[0][:120]))
    page.goto(BASE + '/', wait_until='domcontentloaded')
    page.evaluate("""([u, l]) => {
        localStorage.setItem('library_user', JSON.stringify(u));
        localStorage.setItem('library_lang', l);
        localStorage.setItem('onboarding_done', '1');
        localStorage.setItem('ar_fab_seen', '1');
    }""", [user, lang])
    return ctx, page, errors


def goto(page, path, wait_for=None):
    page.goto(BASE + path, wait_until='domcontentloaded')
    try:
        page.wait_for_load_state('networkidle', timeout=8000)
    except Exception:
        pass  # pages with a live iframe/poll never go idle
    if wait_for:
        page.wait_for_selector(wait_for, timeout=25000)
    page.wait_for_timeout(1200)


# ─────────────────────────────────────────────────────────────────────
def t_login_journey(browser):
    """Real login through the form, not a seeded localStorage session."""
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page(); page.set_default_timeout(15000)
    page.goto(BASE + '/login', wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    page.fill('#login-email', 'sarah@example.com')
    page.fill('#login-password', 'anything')
    page.click('button[type="submit"]')
    page.wait_for_timeout(2500)
    landed = page.evaluate("location.pathname")
    stored = page.evaluate("localStorage.getItem('library_user')")
    record('login: form submit lands on an authed route',
           landed != '/login' and stored is not None, f"path={landed}")

    # session survives reload
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(2000)
    record('login: session survives a reload',
           page.evaluate("location.pathname") != '/login',
           f"path={page.evaluate('location.pathname')}")

    # logout returns to a logged-out state
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => /خروج|logout/i.test(b.textContent))?.click()""")
    page.wait_for_timeout(2000)
    record('login: logout clears the stored session',
           page.evaluate("localStorage.getItem('library_user')") is None,
           f"path={page.evaluate('location.pathname')}")
    ctx.close()


def t_borrow_journey(browser):
    """Borrow from the book page and check MyBooks agrees."""
    ctx, page, errs = new_page(browser)
    goto(page, '/book/12', 'h1, h2')
    # The layout header contains its own h1 greeting; take the title from the
    # catalogue instead of guessing at the DOM.
    title = page.evaluate("""() => {
        const hs = [...document.querySelectorAll('h1,h2')]
            .map(h => h.textContent.trim())
            .filter(t => t && !/^مرحبا|^Welcome/.test(t));
        return hs[0] || null; }""")

    btn = page.evaluate("""() => {
        const b = [...document.querySelectorAll('button')].find(x => /استعارة|borrow/i.test(x.textContent));
        if (!b) return null;
        b.click(); return b.textContent.trim().slice(0, 30);
    }""")
    page.wait_for_timeout(2500)
    after = page.evaluate("""() => document.body.innerText""")
    record('borrow: button exists and page reacts to it',
           btn is not None and ('تم' in after or 'إرجاع' in after or 'مستعار' in after or 'Borrowed' in after),
           f"book={title!r} button={btn!r}")

    # does MyBooks show it?
    goto(page, '/my-books')
    listed = page.evaluate("""(t) => document.body.innerText.includes(t)""", title)
    record('borrow: borrowed title appears in My Books', listed,
           f"looking for {title!r}")
    if errs:
        record('borrow: no page errors', False, errs[0])
    ctx.close()


def t_favorites_persist(browser):
    """The heart control I wired must survive a reload."""
    ctx, page, errs = new_page(browser)
    goto(page, '/book/3', 'h1, h2')
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => b.querySelector('.lucide-heart'))?.click()""")
    page.wait_for_timeout(1200)
    stored = page.evaluate("localStorage.getItem('favorite_books_v1_u2')")
    filled = page.evaluate("""() => {
        const h = document.querySelector('.lucide-heart');
        return h ? getComputedStyle(h).fill : null; }""")
    page.reload(wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    after = page.evaluate("""() => {
        const h = document.querySelector('.lucide-heart');
        return h ? getComputedStyle(h).fill : null; }""")
    record('favorites: persisted to localStorage', stored is not None and '3' in (stored or ''),
           f"stored={stored}")
    record('favorites: filled state survives reload', filled == after and filled not in (None, 'none'),
           f"before={filled} after={after}")
    ctx.close()


def t_admin_crud(browser):
    """Create a book through the admin modal, then delete it."""
    ctx, page, errs = new_page(browser, ADMIN)
    goto(page, '/admin', 'table')
    page.evaluate("""() => [...document.querySelectorAll('.rounded-\\\\[2rem\\\\].w-fit button')][1]?.click()""")
    page.wait_for_timeout(1500)
    before = page.evaluate("() => document.querySelectorAll('tbody tr').length")
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => b.querySelector('.lucide-circle-plus'))?.click()""")
    page.wait_for_timeout(1200)
    has_form = page.evaluate("() => !!document.querySelector('input[name=\"title\"]')")
    if not has_form:
        record('admin: add-book modal opens', False, 'no title input found')
        ctx.close(); return
    page.fill('input[name="title"]', 'كتاب اختبار آلي')
    page.fill('input[name="author"]', 'مختبِر')
    page.select_option('select[name="shelf"]', 'E-1')
    page.click('button[type="submit"]')
    page.wait_for_timeout(2000)

    rows_after_add = page.evaluate("() => document.querySelectorAll('tbody tr').length")
    shelf_kept = page.evaluate("""() => {
        for (const r of document.querySelectorAll('tbody tr')) {
            if (r.innerText.includes('كتاب اختبار آلي'))
                return r.querySelector('td:nth-child(2) span')?.textContent?.trim();
        } return null; }""")
    record('admin: new book is added to the table', rows_after_add == before + 1,
           f"{before} -> {rows_after_add}")
    record('admin: chosen shelf E-1 is saved, not silently reset', shelf_kept == 'E-1',
           f"stored shelf={shelf_kept!r}")

    # edit round-trip: reopen the row and confirm the select shows E-1
    page.evaluate("""() => {
        for (const r of document.querySelectorAll('tbody tr')) {
            if (r.innerText.includes('كتاب اختبار آلي')) {
                r.querySelector('td:last-child button')?.click(); return; } } }""")
    page.wait_for_timeout(1200)
    reopened = page.evaluate("""() => {
        const s = document.querySelector('select[name="shelf"]');
        return s ? { n: s.options.length, value: s.value } : null; }""")
    record('admin: edit modal re-opens on the saved shelf',
           reopened and reopened['value'] == 'E-1' and reopened['n'] == 12,
           json.dumps(reopened))
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => /إلغاء|cancel/i.test(b.textContent))?.click()""")
    page.wait_for_timeout(800)

    # delete it again
    page.on('dialog', lambda d: d.accept())
    page.evaluate("""() => {
        for (const r of document.querySelectorAll('tbody tr')) {
            if (r.innerText.includes('كتاب اختبار آلي')) {
                r.querySelectorAll('td:last-child button')[1]?.click(); return; } } }""")
    page.wait_for_timeout(1500)
    rows_after_del = page.evaluate("() => document.querySelectorAll('tbody tr').length")
    record('admin: delete removes the row', rows_after_del == before,
           f"{rows_after_add} -> {rows_after_del}")
    if errs:
        record('admin: no page errors', False, errs[0])
    ctx.close()


def t_admin_export(browser):
    ctx, page, errs = new_page(browser, ADMIN)
    goto(page, '/admin', 'table')
    with page.expect_download(timeout=10000) as dl:
        page.evaluate("""() => [...document.querySelectorAll('button')]
            .find(b => /تصدير|export/i.test(b.textContent))?.click()""")
    d = dl.value
    path = f'{OUT}/{d.suggested_filename}'
    d.save_as(path)
    head = open(path, encoding='utf-8').read().split('\r\n')[0]
    record('admin: export downloads a CSV with a header row',
           d.suggested_filename.endswith('.csv') and 'الاسم' in head,
           f"{d.suggested_filename} :: {head[:60]}")
    ctx.close()


def t_language_switch(browser):
    ctx, page, errs = new_page(browser, STUDENT, 'ar')
    goto(page, '/search')
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => /ENGLISH|العربية/i.test(b.textContent))?.click()""")
    page.wait_for_timeout(1800)
    lang_after = page.evaluate("localStorage.getItem('library_lang')")
    dir_after = page.evaluate("() => document.querySelector('[dir]')?.getAttribute('dir')")
    record('i18n: toggle flips the stored language and document direction',
           lang_after == 'en' and dir_after == 'ltr', f"lang={lang_after} dir={dir_after}")

    goto(page, '/my-books')
    stayed = page.evaluate("localStorage.getItem('library_lang')")
    record('i18n: choice survives navigation to another page', stayed == 'en', f"lang={stayed}")
    ctx.close()


def t_map_navigation(browser):
    """The map has a 2D/3D toggle; the SVG path only exists in 2D, and the
    destination is chosen by picking a book, not by clicking a shelf chip."""
    ctx, page, errs = new_page(browser)
    goto(page, '/map')

    # 3D is a separate iframe-mounted scene
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(x => x.textContent.trim() === '3D')?.click()""")
    page.wait_for_timeout(2500)
    record('map: 3D mode mounts the floor-plan scene',
           page.evaluate("() => document.querySelectorAll('iframe').length") == 1)

    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(x => x.textContent.trim() === '2D')?.click()""")
    page.wait_for_timeout(2000)
    record('map: switching back to 2D unmounts the iframe and renders SVG',
           page.evaluate("() => document.querySelectorAll('iframe').length") == 0
           and page.evaluate("() => document.querySelectorAll('svg').length") > 0)

    picked = page.evaluate("""() => {
        const b = [...document.querySelectorAll('button')].find(x => /B-2/.test(x.textContent));
        if (!b) return null; b.click(); return b.textContent.trim().slice(0, 30); }""")
    page.wait_for_timeout(3000)
    drawn = page.evaluate("""() => ({
        motion: document.querySelectorAll('animateMotion').length,
        gradientPath: document.querySelectorAll('path[stroke^="url("]').length })""")
    record('map: choosing a book draws a gradient path with moving arrows',
           drawn['motion'] >= 1 and drawn['gradientPath'] >= 1,
           f"picked={picked!r} {json.dumps(drawn)}")
    if errs:
        record('map: no page errors', False, errs[0])
    ctx.close()


def t_notifications_regression(browser):
    ctx, page, errs = new_page(browser, dict(STUDENT, borrowedBooks=['1', '2']), width=390, height=844)
    goto(page, '/')
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => b.querySelector('.lucide-bell'))?.click()""")
    page.wait_for_timeout(1200)
    box = page.evaluate("""() => {
        const p = document.querySelector('div.fixed.w-80');
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { x: r.x, right: r.x + r.width, w: innerWidth }; }""")
    record('notifications: panel stays fully on-screen at 390px',
           box and box['x'] >= 0 and box['right'] <= box['w'] + 1, json.dumps(box))
    times = page.evaluate("""() => [...document.querySelectorAll('div.fixed.w-80 h4')]
        .map(h => h.closest('.p-6')?.querySelector('span')?.textContent?.trim())""")
    record('notifications: timestamps differ by age (not all "just now")',
           len(set(times)) > 1, f"{times}")
    ctx.close()


def t_help_to_admin(browser):
    """Cross-role: an inquiry sent by a student must reach the admin inbox."""
    ctx, page, errs = new_page(browser)
    goto(page, '/help')
    page.evaluate("""() => [...document.querySelectorAll('button')]
        .find(b => /تواصل معنا|contact us/i.test(b.textContent))?.click()""")
    page.wait_for_timeout(1000)
    marker = 'بصمة اختبار E2E'
    page.fill('#contact-name', 'سارة أحمد')
    page.fill('#contact-email', 'sarah@example.com')
    page.fill('#contact-message', marker)
    page.click('button[type="submit"]')
    page.wait_for_timeout(2500)
    sent = page.evaluate("() => document.body.innerText.includes('بنجاح')")
    record('help→admin: student sees a success state', sent)
    ctx.close()

    ctx2, page2, _ = new_page(browser, ADMIN)
    goto(page2, '/admin', 'table')
    page2.evaluate("""() => [...document.querySelectorAll('.rounded-\\\\[2rem\\\\].w-fit button')][6]?.click()""")
    page2.wait_for_timeout(2500)
    found = page2.evaluate("""(m) => {
        const card = [...document.querySelectorAll('.official-card')].find(c => c.innerText.includes(m));
        if (!card) return null;
        return { hasMailto: !!card.querySelector('a[href^="mailto:"]'),
                 emojiInMoodSlot: /[😍🤩😊😐😕]/.test(card.innerText) }; }""", marker)
    record('help→admin: the inquiry actually arrives in the admin inbox', found is not None,
           json.dumps(found))
    if found:
        record('help→admin: shown as a ticket with a reply address, not a mood rating',
               found['hasMailto'] and not found['emojiInMoodSlot'], json.dumps(found))
    ctx2.close()


TESTS = [t_login_journey, t_borrow_journey, t_favorites_persist, t_admin_crud,
         t_admin_export, t_language_switch, t_map_navigation,
         t_notifications_regression, t_help_to_admin]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME,
                                args=['--use-fake-ui-for-media-stream',
                                      '--use-fake-device-for-media-stream'])
    for t in TESTS:
        print(f"\n── {t.__name__}")
        try:
            t(browser)
        except Exception as e:
            record(t.__name__ + ' (crashed)', False, f"{type(e).__name__}: {str(e)[:160]}")
            traceback.print_exc(limit=1)
    browser.close()

passed = sum(1 for _, ok, _ in results if ok)
print(f"\n{'='*64}\n{passed}/{len(results)} passed")
for n, ok, d in results:
    if not ok:
        print(f"  FAIL  {n}\n        {d}")
sys.exit(0 if passed == len(results) else 1)
