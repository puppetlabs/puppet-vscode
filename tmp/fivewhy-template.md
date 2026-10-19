<!--
Five-Why template saved verbatim from user. Keep this file as the canonical template for 5-Whys investigations.
Do not edit here; copy this template when starting a new investigation.
-->

<!--
Template: fivewhy-template.md
Saved from user on 2026-10-19
-->

<!--
Paste the full template content provided by the user below.
-->

<!--
Common Guidelines
Orientation — capture the knowledge behind the problem (read this first):

- This document is almost always written mid-investigation — while fixing a bug, a broken build, or a failing test. **The problem is the lens, not the subject.** Solving it is the author's day-job; it is not what this document is for.
- The document's enduring value is the **domain knowledge that the problem revealed** — how the system (e.g. Bolt, Puppet, Puppet Enterprise) actually works. Make that the centre of gravity.
- Before writing, answer for yourself: *What does this problem and its solution verify about the domain? What is now understood better about how this system behaves, because of this issue?* Let those answers drive the content.
- Keep the triggering problem to a brief motivating context (a sentence or two: "this surfaced while fixing X"). Spend the document on the mental model, mechanism, and transferable insight that outlive the specific incident.
- Litmus test: if the specific problem vanished tomorrow, the document should still be worth reading as an account of how the domain works.

Style Guidelines (Strict):

- Treat this document as a template to be filled, not redesigned.
- Replace placeholder text completely; do not leave generic filler.
- Keep wording concise, specific, and scoped to this document's topic.
- Use bulleted lists with `-` instead of numbered lists for easy reordering.
- Create headings without numbers (e.g., `### Install Package` not `### Step 1: Install Package`).
- Keep headings descriptive so steps can be rearranged without renumbering.

Heading Rules:
- All `###` and lower subheadings must be concise, descriptive titles (3-7 words).
- Placeholder headings (e.g., `### Concept 1`, `### Change 1`) must be replaced with topic-specific titles before completion.
- Use `####` subheadings for subsections instead of bold text with numbers.

Linking Rules:
- Every reference in Related Topics must be a real link (no placeholder bullets).
- **Code**: Link to GitHub with a **permalink** — a commit-SHA-pinned URL with line numbers, NOT a `blob/main` branch URL: [`filename:line`](https://github.com/org/repo/blob/<commit-sha>/path/file.rb#L123). Use the full 40-char SHA (or at least the abbreviated one). Permalinks are mandatory because branch URLs silently drift to the wrong lines as the file changes; a SHA pin always points at the code as it was when you wrote about it. (On GitHub press `y` to convert a branch URL to a permalink.)
- **Commits**: Link to the actual commit: [`short-sha`](https://github.com/org/repo/commit/full-sha). In PR descriptions, each change section must include a commit link so reviewers can navigate directly to the diff.
- **Tickets and named entities**: Link every ticket, PR, epic or case the FIRST time it appears in the document and again in Related Topics, never as a bare ID. Jira: [`BOLT-202`](https://perforce.atlassian.net/browse/BOLT-202); GitHub PR: [`repo#123`](https://github.com/org/repo/pull/123). Also link a named repo, product page or Slack thread when a reader would want to open it. Before saving, grep the finished doc for bare ticket IDs (`grep -nE "\b[A-Z]{2,6}-[0-9]+\b"`) and confirm each hit sits inside a link.
- **Docs**: Link to official documentation pages.
- **Local**: Link to local docs with Obsidian-style wiki links: `[[doc-filename]]` or `[[doc-filename|display text]]`. Use the filename without the `.md` extension. Wiki links resolve by filename, so they survive file moves within the vault.
- **Chat (Slack, etc.)**: Every quoted message needs its own permalink, not just a link to the thread as a whole — a paraphrase with no per-message link is not proof under the Evidence Discipline below. Slack permalinks aren't one-click like GitHub's `y` key; build them from the message's `ts` (timestamp): `https://<workspace>.slack.com/archives/<channel-id>/p<ts-with-the-decimal-point-removed>` (append `?thread_ts=<root-ts>&cid=<channel-id>` when the message is a thread reply, for readers who need thread context). E.g. `ts` `1789633639.433619` in channel `G049EJF2Z2A` becomes `https://workspace.slack.com/archives/G049EJF2Z2A/p1789633639433619`.

Code Evidence Requirement (required when code is referenced):
- For each major section,
  - include BOTH a source link to real code (with line numbers), and a short "Code Sample" block that clarifies intent.
- The "Code Sample" may be:
  - A minimal real excerpt, or
  - A simplified pseudocode version with brief comments.
- The sample must explain behavior, not just repeat syntax.
- Keep samples small and focused (about 5-20 lines).
- Add 1-3 bullets under each sample explaining:
  - what the code is doing,
  - why it matters in this document,
  - and any important caveat/assumption.
- Never fabricate APIs or behavior; if code cannot be verified, explicitly state that and omit the sample.

Evidence Discipline — proven vs. inferred is a first-class distinction (mandatory, universal to every diataxis type):

- **Bias toward proven.** Every factual claim in this document must default to proven-with-evidence. A claim is *proven* only when it is backed by a first-hand artefact the reader can independently open — a commit-SHA permalink, a quoted log line, a live command's exit code and output, a Slack `ts` link, a ticket ID, a screenshot, a test that reproduces it. Restating what someone said without a link is **not** proof.
- **Never smuggle an inferred claim into a proven-looking sentence.** If any sub-claim inside a paragraph, bullet, table row, evidence block, or code annotation is not first-hand-verifiable, that sub-claim MUST be marked inline with the literal bolded phrase **`Inferred, not proven.`** (verbatim, so it is greppable). Do not soften with adjacent language ("likely proven", "probably confirmed"); the marker is binary. When multiple sub-claims share a section, prefer a per-claim verdict table (claim → evidence → verdict) over prose, because prose hides gaps and tables surface them.
- **Every inferred claim owes the reader two things: what would prove it, and why it isn't proven yet.** Beside every `**Inferred, not proven.**` marker, name the specific artefact that *would* upgrade it (e.g. "would be proven by inspecting the Jenkins job history for `pipeline_release-packages_publish` between 2026-02-10 and 2026-07-31") and briefly say why that check was not done in this investigation (out of scope, no access, blocked on X, next step). An inferred claim without a named upgrade-path is a bug in the document.
- **Follow-up is not optional if it matters.** If the inferred claim is load-bearing for the document's conclusion (root cause, recommended fix, next step, ADR verdict), the document MUST also record either (a) a named follow-up action (ticket, task, next investigation), or (b) an explicit acknowledgement that the conclusion is contingent on that unproved link. Load-bearing inference without a follow-up is prohibited.
- **Author's checklist before publishing.** Before saving the file, grep it for weasel-words that mask inference: "clearly", "must have", "obviously", "certainly", "we know that", "presumably". Every occurrence is a mandatory review point — either replace with a proven citation, or replace with `**Inferred, not proven.**` + upgrade path.

This discipline exists because a diataxis document that reads *proven* on the surface but contains hidden inferred assertions silently invalidates every conclusion built on top of it. Transparency of provenance is not an optional courtesy — it is how the document earns the reader's trust to act on it.

Diagrams (use Mermaid where it earns its place):
- Reach for a Mermaid diagram when a picture explains structure or flow faster than prose would — for example: how components fit together, a sequence of steps or messages, a state transition, or a before/after of a change.
- Do NOT add a diagram just to have one. If the prose is already clear, or the relationship is trivial (two or three linear steps), skip it — a needless diagram is worse than none.
- Prefer one focused diagram over a single sprawling one; split distinct ideas into separate diagrams. If a diagram would otherwise grow wide (many parallel subgraphs/branches, or several loosely-related stages), first check whether splitting it into two or more smaller diagrams reads more clearly than one large one — prefer that split over cramming everything into a single diagram.
- Use a fenced ` ```mermaid ` block. Keep node labels short and the diagram readable without zooming.
- **Orient top-to-bottom for flowcharts and state diagrams**: use `flowchart TD` (or `TB`) and `stateDiagram-v2` default direction, not `flowchart LR`. Rendered width grows with the diagram in a top-to-bottom layout, so the reader scrolls vertically (natural) instead of horizontally (requires scrolling the page sideways, which most viewers handle poorly). Only use `LR` when the content is inherently a short horizontal sequence (2-4 nodes) that reads awkwardly stacked vertically — a rare exception, not the default. This does NOT apply to `sequenceDiagram` — participants are naturally laid out left-to-right with time flowing down, so that convention stays as-is.
- If a flowchart has several parallel branches (e.g. multiple subgraphs or sibling paths), stack them as sequential top-to-bottom sections rather than side-by-side columns, even if that makes the diagram taller — taller is scrollable in place, wider is not. If stacking makes the single diagram feel overloaded, split it instead (see above).
- Always keep the surrounding prose self-sufficient: the diagram should reinforce the explanation, not be the only place a key point is made (it may not render on every surface).

File Setup Formatting Rule (required for how-to steps):
- Do not use heredoc-style file creation commands such as `cat > file <<'EOF'` in instructional steps.
- For each file, present setup as:
  - `Create <path/filename>` (short purpose sentence), then
  - one fenced code block containing the file contents.
- Include the filename as the first line in the code block (for example, `# hosts.yaml`).
- Keep command blocks for executable commands only (for example, directory setup, `bundle install`, and test execution).

Template-Specific Guidelines

Subject Requirement (the analysis traces one problem to its root cause):
- This document performs a single 5 Whys investigation on one specific, well-defined problem. Do not bundle multiple unrelated symptoms into one analysis.
- Each "Why" answer must be evidence-based (a log line, a stack trace, a reproduction step, a code reference) — not a guess. If an answer can't be verified, say so and stop; a fabricated chain produces a fabricated root cause.
- Keep the chain causal: each Why's answer becomes the subject of the next Why. Do not jump levels or answer a different question than the one just asked.
- Focus on process and system causes, not individual blame. "The deploy script didn't validate config before applying it" is a root cause; "Alice made a mistake" is not.
- Five is a guideline, not a rule: stop as soon as the root cause is proven (see Root Cause requirement below). Continue past five if the chain is still surface-level.

Purpose Section Requirement:
- Rewrite the Purpose questions so they explicitly describe what this specific investigation traces and resolves.
- Do not keep generic Purpose questions if they are template placeholders.

Root Cause Analysis Section Requirement (transparency of method is mandatory):
- Title each Why heading with the specific question itself (e.g. `### Why did the deploy silently skip validation?`) — do not prefix or number headings as "Why 1:", "Why 2:", etc. The question wording is the only heading; numbering adds clutter without adding information.
- Each Why must open with **Why This Tool**: one sentence justifying the choice of tool/command *before* showing it — what it can tell you that a faster or more obvious alternative couldn't, or why it was the most direct way to answer this specific question. This is reasoning, not narration; "because it shows X and this Why is about X" beats "let's check the logs."
- Each Why must show its **Investigation**: the actual tool(s), command(s), or process used to dig into or replicate that specific question — not just the answer. Prefer one fenced shell block with a comment on each step explaining what that step checks and why. If a GUI, dashboard, or doc was consulted instead of a command, name it and link it.
- Each Why must show its **Evidence**: the exact signal the investigation produced (a quoted log line, error message, exit code, metric, or doc excerpt) — the thing that actually justifies the Answer, not a paraphrase of it.
- **The universal Evidence Discipline rule (in `common.metadata` above) is load-bearing for a fivewhy — apply it stringently here.** In a five-why, an unverified sub-claim doesn't just mislead one reader; it becomes the *subject* of the next Why heading, so every Why built on top of it inherits the invalidation. Every sub-claim inside an Evidence block that would answer "was this step actually done?" or "did this event actually occur?" must either carry a first-hand citation inline OR be marked with the literal bolded phrase **`Inferred, not proven.`** with its named upgrade-path and reason-not-verified, per the common rule. When more than one sub-claim shares a section, use a per-claim verdict table (claim → evidence → verdict) — prose hides gaps, tables surface them.
- **Load-bearing inferred claims force follow-up.** If any Why's Answer rests on a sub-claim marked `**Inferred, not proven.**`, the fivewhy MUST record — in the Solution section or as an explicit "Next investigation" bullet in the Related Topics — the specific follow-up needed to either upgrade the inference to proof or refute it. A five-why whose root cause is contingent on unproven links, without a named follow-up, is not finished.
- Each Why must close with **Next Problem**: one sentence naming the next question to chase, worded so it can become the next Why heading verbatim — a reader should be able to predict that heading from this line before turning the page.
- Do not skip Why This Tool/Investigation/Evidence because the answer "seems obvious" — an unverified link in the chain invalidates everything built on top of it.
- Add or remove Why steps to match the chain actually investigated — do not pad to exactly five.

Root Cause & Solution Requirement (provenance is mandatory, not just proof):
- "Root Cause" states the final cause in one or two sentences — the thing that, if fixed, prevents the symptom from recurring.
- Root Cause requires **Proof**, not assertion: describe the specific check that confirmed this is the actual root cause and not just the deepest symptom reached (e.g. reverting the fix reproduces the original symptom, a minimal repro isolates exactly this cause, removing this factor alone stops the failure). State what was done and what result confirmed it.
- Root Cause requires **Known Issue?**: state explicitly whether this matches a previously documented issue — link the tracker ticket, changelog entry, vendor advisory, or prior incident doc that confirms it. If no prior report exists, say so plainly ("No prior report found — this root cause is derived solely from the Investigation trail above") rather than leaving provenance ambiguous.
- "Solution" addresses the root cause, not the symptom described in Background. If a temporary mitigation was also applied, name it separately from the durable fix.
- Solution requires **Source**: cite where the fix came from — official docs, a changelog, a prior commit/PR, a vendor-recommended workaround — with a link. If there was no precedent and the fix was derived independently from the Root Cause, say so explicitly.

Final Compliance Check (required before finishing):
- Heading structure unchanged.
- Placeholder text removed.
- Purpose questions are document-specific.
- Every Why has Why This Tool, Investigation (tool/command shown), Evidence (the actual signal), and Next Problem.
- Every sub-claim inside an Evidence block is individually evidenced (inline citation) or explicitly marked `**Inferred, not proven.**` with its named upgrade-path and reason-not-verified — no unverified assertions hidden inside otherwise-evidenced sections. Verified by grep: run `grep -nE "clearly|must have|obviously|certainly|we know that|presumably"` on the finished doc and audit every hit; there should be zero occurrences of unqualified inference.
- Every load-bearing inferred claim (one that supports the Root Cause, the Solution, or an Answer that becomes the next Why's Next Problem) has a matching follow-up action or explicit contingency acknowledgement recorded in Solution or Related Topics.
- Root Cause includes Proof and Known Issue?, not just a claim.
- Solution targets the root cause and includes Source.
- Related Topics links are all concrete and valid.
- Each code reference includes both a link and an explanatory code sample.
- File setup instructions use "Create <file>" + code block format (no `cat > ...` heredoc flow).
-->
