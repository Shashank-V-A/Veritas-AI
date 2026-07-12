# Veritas AI — Knowledge Base (for Jotform AI Agent)

Use this document as the chatbot’s knowledge base / training context.

---

## 1. Product identity

**Name:** Veritas AI  
**Tagline:** Don't consume information. Verify it.  
**Type:** AI-powered credibility / fact-investigation platform  
**Audience:** Analysts, journalists, researchers, decision-makers, and everyday users who need to verify news, forwards, posts, and media  
**Tone of product UI:** Dark “investigation desk” / classified-case aesthetic (not a casual chat app)

**What Veritas is:**  
A tool that turns messy content (articles, WhatsApp/Telegram forwards, YouTube, PDFs, images) into a **structured credibility dossier** — trust score, claims, bias, fallacies, evidence context, and a neutral rewrite.

**What Veritas is not:**  
- Not a general ChatGPT clone  
- Not a social network  
- Not a news publisher  
- Does not claim 100% certainty on every verdict; evidence can be thin

---

## 2. Core value proposition

1. Paste or upload content → get a professional **case report**, not a chat reply  
2. Built for **India / social forward** use cases (WhatsApp/Telegram patterns) as well as general web content  
3. Archive cases, share public links, explore a knowledge graph of claims/sources  
4. Watch claims over time (new cases + optional web scan + alerts)

---

## 3. How to get started (user journey)

1. Open the Veritas website (landing page)  
2. **Sign in with Google** (required for full analysis, archive, exports)  
3. Go to **Workspace** (`/app`)  
4. Choose an intake mode and submit:  
   - Paste text  
   - Paste article URL  
   - YouTube link (transcript)  
   - Upload image/meme (OCR)  
   - Upload PDF  
5. Wait for the investigation loading screen (optional soundscape)  
6. Open the **case report** with trust score, verdict, claims, etc.  
7. Optionally: annotate, add evidence exhibits, pin claims, share, export PDF/Markdown, re-analyze

**Guest access:** Full analysis requires Google sign-in. The landing page may show a sample/demo dossier; Judge mode at `/judge` shows demo loops.

---

## 4. Main areas of the app (navigation)

| Area | Path (typical) | What it does |
|------|----------------|--------------|
| Landing / home | `/` | Marketing, sign-in, product story |
| Workspace | `/app` | New investigation intake |
| Case files | `/app/history` | Archive of past analyses |
| Claim watchlist | `/app/watchlist` | Pinned claims; case hits + web hits; scan & alerts |
| Knowledge graph | `/app/graph` | Visual constellation of analyses/claims/sources (Neo4j when configured) |
| Settings | `/app/settings` | Locale (English/Hindi), preferences |
| Case report | `/app/analysis/:id` | Full dossier for one investigation |
| Source dossier | `/app/domain/:domain` | Outlet reputation, trust trend, common claims, related cases |
| Public share | `/share/:token` | Public view of a shared report |
| Judge mode | `/judge` | Kiosk/demo mode; samples + live narrative clusters when signed in |

**Sidebar:** Collapsible — expanded (labels) or icon-only (symbolic) view.

---

## 5. Analysis inputs

Users can investigate:

- **Raw / pasted text** (articles, posts, forwards)  
- **Web URL** (page extraction + analysis)  
- **YouTube** (transcript-based)  
- **Image / meme** (OCR then analysis)  
- **PDF** upload  
- **Forward-style content** — WhatsApp/Telegram patterns auto-detected; forward-risk badge  
- Deep link for forwards: `/app?text=...&source=whatsapp` or `telegram`  
- Chrome extension / bookmarklet: open Workspace with `q` or `url` (+ `autorun=1` to start automatically)

---

## 6. What’s inside a case report (dossier)

Typical sections:

- **Verdict** (e.g. credible, mixed, misleading, unsupported)  
- **Trust score** (0–100 style score) + heuristic **confidence / trust range**  
- **Evidence strength** signal — strong / moderate / thin (based on search hits & supporting context; thin means treat the score cautiously)  
- **Mesh attribution** — which model/latency powered the analysis  
- **Summary** + **ELI15** (simple explanation)  
- **Claims breakdown** — each claim with status, confidence, evidence notes  
- **Claim graph / relations** (when available)  
- **Source lineage** — live web-search context links  
- **Claim timeline** (when available)  
- **Bias vectors** (political / commercial / ideological lean)  
- **Emotion profile**  
- **Logical fallacies**  
- **Missing context**  
- **Neutral rewrite** (side-by-side with original)  
- **Investigation trail** (reasoning steps)  
- **Suggested / further reading**  
- **Domain reputation badge** → opens source dossier for that outlet  
- **Case notes** — private scratch-pad notes (optional link to a claim)  
- **Evidence locker** — structured exhibits: URL, note, or screenshot *reference* (case-level evidence list; different from casual notes)  
- **Verdict feedback** — “This verdict is wrong” stores a correction for review; does **not** instantly rewrite the report  
- **Actions:** Share link, export PDF, export Markdown, print, re-analyze, delete  

**Re-analyze:** Creates a new related case and can show a verdict/trust changelog vs the previous run.

---

## 7. Verdicts (what they mean — guide users carefully)

Veritas produces investigative judgments, not legal rulings:

- **Credible** — content largely checks out given available evidence  
- **Mixed** — some support, some problems  
- **Misleading** — framing or claims likely to mislead  
- **Unsupported** — claims lack adequate backing  

Always remind users: AI-assisted analysis can be wrong; check primary sources; thin evidence = lower confidence.

---

## 8. Claim watchlist (how it works)

1. Open a case → **Evidence log** → expand a claim → **Watch this claim**  
2. Claim appears under **Claim watchlist**  
3. **Case hits:** when a *new* analysis you run contains a similar claim, hit count increases + in-app/email/browser alerts (if enabled)  
4. **Web hits:** use **Scan web now** (or per-claim Scan); scheduled scans can run in production (~every 6 hours when cron is configured)  
5. Alerts:  
   - In-app notification bell  
   - Optional browser notifications  
   - Optional email (Resend) when server email is configured  

**Pinning does not change the original report.**  
**Watchlist does not continuously scrape the entire internet without a scan/cron.**

---

## 9. Source dossier (domain page)

From a report’s domain badge, users can open a dossier for an outlet/domain:

- Average trust, case counts, low-trust counts  
- Trust trend over time  
- Common recurring claims  
- List of cases from that outlet  

This is archive-based (user’s related cases / reputation data), not a full independent media-rating agency.

---

## 10. Knowledge graph

- Optional Neo4j-backed graph of analyses, claims, sources, domains  
- Synced after analyses  
- Deleting case files should reflect in the graph (user-scoped views)  
- Judge mode can show **narrative clusters** of related live cases when enough related cases exist  

---

## 11. Chrome extension

- Manifest V3 extension in the project’s `extension/` folder  
- “Verify with Veritas” on page or selection  
- Opens the app Workspace with prefilled text/URL and `autorun=1` so analysis can start when signed in  
- User configures the Veritas app URL in the extension popup (e.g. production URL or localhost)

---

## 12. Languages & accessibility

- UI languages: **English** and **Hindi**  
- Dark theme investigation desk  
- Reduced-motion support  
- Skip link / keyboard-friendly patterns where implemented  

---

## 13. Tech overview (for advanced / support questions)

- Frontend: React, Vite, TypeScript, Tailwind, Framer Motion  
- Backend: Node.js, Express (deployable on Vercel serverless)  
- Auth: Google OAuth + JWT session cookies  
- AI provider: **Mesh API** (exclusive analysis provider)  
- DB: Prisma + SQLite locally; Turso/libSQL recommended in production  
- Optional: Neo4j Aura for knowledge graph; Tavily for web search (DuckDuckGo fallback); Resend for watchlist emails  

The chatbot should **not** invent API keys, internal secrets, or claim access to user private case data.

---

## 14. Common FAQ answers

**Q: Do I need an account?**  
A: Yes — Google sign-in is required to run investigations and keep a private archive.

**Q: Can Veritas analyze WhatsApp forwards?**  
A: Yes. Paste the forward text in Workspace. Forward-style language is detected and risk can be shown. You can also use deep links with `source=whatsapp` or `telegram`.

**Q: What’s the difference between Case notes and Evidence locker?**  
A: Notes = private scratch pad. Evidence locker = structured exhibits (URL / note / screenshot reference) as a formal evidence list for the case.

**Q: If I say the verdict is wrong, does the report change?**  
A: No. Feedback is stored for improvement/review. Use re-analyze if you want a fresh run.

**Q: Does watchlist email me automatically?**  
A: Only if email alerts are enabled on the claim **and** the server has email (Resend) configured. Otherwise use in-app / browser alerts and the watchlist page.

**Q: Is the trust score perfect?**  
A: No. Check the evidence-strength chip and sources. Thin evidence means be cautious.

**Q: Where do I export a report?**  
A: On the case report actions: PDF, Markdown, print, or share a public link.

**Q: What is Judge mode?**  
A: A demo/kiosk view at `/judge` that rotates sample dossiers and can show live narrative clusters for signed-in users with related cases.

---

## 15. Boundaries for the chatbot

- Help users **navigate and understand Veritas AI**  
- Do **not** run live fact-checks inside the chat as a substitute for Workspace analysis — guide them to start an investigation in the app  
- Do **not** invent features that don’t exist  
- Do **not** ask for passwords or API keys  
- If unsure, say so and point to Workspace, Case files, Settings, or the report they’re viewing  
- For medical/legal/financial claims: remind users Veritas is an aid, not professional advice  

---

## 16. Short product one-liner (for greetings)

“Veritas AI is an investigation desk that turns articles, forwards, and media into structured credibility dossiers — so you verify information instead of just consuming it.”
