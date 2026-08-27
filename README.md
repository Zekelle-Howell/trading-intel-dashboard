# Trading Intel

Reads federal contract solicitations off SAM.gov, runs each one through Claude to figure out who's likely to win it and whether they're publicly traded, and emails me the ones worth looking at. There's a React dashboard on top of it.

**Live:** [trading-intel-dashboard-one.vercel.app](https://trading-intel-dashboard-one.vercel.app)

Two repos: this one is the front end, [`trading-intelligence`](https://github.com/Zekelle-Howell/trading-intelligence) is the Python scanner.

---

## The idea

Solicitations go public the moment they post — weeks before anyone announces an award. If the Army opens bidding on a drone program, you can usually tell which companies are positioned to win it right then. But that information sits in a government database in a format nobody reads.

So: read it automatically, have an LLM extract the companies, filter to the ones you can actually trade, and alert on those.

## Flow

`SAM.gov API → Python scanner (Railway) → Claude API → Supabase → email + React dashboard (Vercel)`

The scanner polls SAM.gov on a schedule, keyword-filters ~100 solicitations per cycle down to relevant sectors, sends survivors to Claude for scoring and entity extraction, writes typed rows to Postgres, and fires email only when the result clears two conditions. The dashboard reads Supabase directly — no backend of its own.

**Stack:** Python 3, React 18, PostgreSQL via Supabase, Anthropic Claude API, Railway, Vercel, SMTP.

---

## Decisions and why

**90-minute scan interval.** Not a performance choice — a budget one. SAM.gov issues personal API keys with a cap of 10 requests per day. At 90 minutes across a 12-hour window that's ~8 scans, which fits. Anything faster and you burn the daily allowance before lunch and get `429` for the rest of the day. The interval is set by the rate limit, not by how fresh the data could be.

**Supabase instead of raw Postgres.** It exposes a REST API over the database, so the React app talks to it directly and I never had to write or host a backend for the front end. One less service to deploy.

**Email instead of push or webhooks.** Zero additional infrastructure, works on my phone already, and a contract alert isn't time-critical to the second. Push notifications would have meant another service and another integration for no real gain.

**Claude returns objects, not strings.** The first version asked for competitors as a flat list of names. That parsed fine and was useless — no way to tell Northrop Grumman from Anduril programmatically. Rewrote the prompt to require `{name, ticker, public}` per company. That one change is what makes the "only alert on publicly traded companies" filter possible at all.

**Dashboard defaults to score 6+ and hides expired.** With no filter it renders 140+ rows, most of them routine parts procurement scored 3/10, half with deadlines that already passed. The default view exists to be useful, not complete. Filters are there if you want everything.

---

## Things that broke

Keeping these because they're the parts I actually learned from.

**Git silently did nothing.** Copied a new `App.js` over the old one, ran `git add`, and got `nothing to commit, working tree clean`. Pushed anyway, deployed anyway, and spent twenty minutes wondering why the live site hadn't changed. The two files were byte-identical — the copy had grabbed a stale download. Now I run `git diff --cached --stat` before committing and confirm the insertion count is nonzero.

**Broke a working site with a "safe" refactor.** Rewrote the Supabase layer to use `@supabase/supabase-js` instead of raw `fetch`. Vercel build failed — the package was never in `package.json`. Installed it, redeployed, got a blank white page. Console said `supabaseKey is required`: the client-side env var wasn't set on Vercel. Rolled the whole thing back with `git revert --no-commit HEAD~2..HEAD` and went back to plain `fetch`, which had been working the entire time and needed no dependency at all.

**RLS returned 200 with nothing in it.** Dashboard fetched successfully, no console errors, zero rows rendered. Supabase had 140 records sitting right there. Row Level Security is on by default and was filtering everything out for the anon key — a successful request returning an empty array, which looks identical to "there's no data" from the front end.

**Sector keywords ended up in the ticker column.** A fallback in the save function wrote `", ".join(sectors[:3])` when no watched stock matched, so the `tickers` column filled with `"port, microgrid"` instead of ticker symbols. The dashboard matched those against the watchlist, found nothing, and rendered blank badges. Most contracts don't mention a watched stock, so this hit almost every row before anyone noticed.

**Expired contracts everywhere.** Cards showing `-86d` — solicitations whose bidding closed three months ago, ranked alongside live ones. The deadline math was fine, nothing ever checked whether the result was negative.

---

## Known limitations

Being straight about what this doesn't do:

- **No tests.** Nothing automated. Every deploy is verified by looking at Railway logs and the live site.
- **No retry logic.** A `429` from SAM.gov or a timeout from Claude drops that scan cycle. It logs the error and waits for the next one. Exponential backoff is the obvious fix and isn't written.
- **Dedup state lives on ephemeral disk.** `seen_contracts.json` sits on Railway's filesystem, which doesn't survive a redeploy. Lose it and the scanner re-alerts on contracts it already sent. This belongs in the database and doesn't take much to move — it just hasn't been.
- **RLS is disabled.** I turned it off to get the dashboard reading and never wrote proper policies. The anon key is public in client code, so anyone can read these tables, and the Manage tab's insert/delete paths mean they could write to `watched_stocks` too. The data isn't sensitive — it's all public procurement records — but this is a real hole, not a design choice.
- **Single page per scan.** Pulls the first 100 results and stops. Anything past that in a given window is never seen.
- **LLM output isn't schema-validated.** It's `json.loads` inside a try/except. Malformed output means that contract is skipped silently rather than caught and retried.
- **Watchlist changes require a redeploy.** The tickers are a constant in `scanner.py`. The dashboard reads its list from the database, but the scanner doesn't.

## What I'd change

Move the seen-set into Postgres so restarts stop mattering. Write real RLS policies instead of leaving it off. Add backoff and retry around both external APIs. Validate Claude's response against a schema before trusting it. Pull the scanner's watchlist from the `watched_stocks` table so the Manage tab actually controls both halves of the system.

---

## Running it locally

```bash
git clone https://github.com/Zekelle-Howell/trading-intel-dashboard.git
cd trading-intel-dashboard
npm install
npm start
```

Runs on `localhost:3000`. The Supabase URL and anon key are in `src/App.js` — public read access by design.

---

Personal project, built for research and for learning how these pieces fit together. Not investment advice.
