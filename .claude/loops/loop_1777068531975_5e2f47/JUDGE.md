# Completion criteria

Loop directory: `/home/jarda/clay-projects/mcp-charts/.claude/loops/loop_1777068531975_5e2f47`

PASS only when **every** criterion below is satisfied. Verify each by reading the codebase directly; do not trust commit messages alone.

## 1. State file shows three consecutive clean rounds

- `STATE.json` exists at the loop directory root.
- `STATE.json.clean_rounds >= 3` and `target_clean_rounds === 3`.
- The last three entries in `STATE.json.iterations` each have `bugs_found: 0` and `bugs_fixed: 0`.
- Every iteration has a `critic_report` path that resolves to an actual file under `renders/round-<N>/critic-report.json`. Open each of the last three reports and confirm `clean === true` and `bugs.length === 0`.

## 2. Programmer made real code changes (not just state-file updates)

- Run `git log --since=<STATE.json.loop_started_at> --name-only --format=''` and confirm commits modified files under `src/` — not only `STATE.json` or render outputs.
- For every entry in `STATE.json.fixes_applied`, confirm the listed `files` actually appear in the diff range.
- If `STATE.json.fixes_applied` is empty, the programmer must at minimum show three clean iterations against different random seeds — verify `STATE.json.iterations[*].seed` values differ across the last three rounds.

## 3. Anti-cheating rule: no adversarial specs committed

- Run `git log -p --since=<STATE.json.loop_started_at> -- examples/specs.json examples/edge-cases.json`.
- The diff must show **zero** added objects to either file. Comment-only edits, metadata-only edits, or no changes are all acceptable. Any newly added `_slug` entry during the loop is an automatic FAIL.

## 4. Build and zoo still healthy

- `npm run build` completes with exit 0.
- `npm run zoo:all` completes with exit 0.
- `ls examples/charts*/ -la` shows every expected PNG present and non-zero bytes. 210 images total across `charts/`, `charts-square/`, `charts-portrait/`, `charts-landscape-edge-cases/`, `charts-square-edge-cases/`, `charts-portrait-edge-cases/`.

## 5. Tests still pass

- `npm test` exits 0.
- If `STATE.json.fixes_applied` recorded bug fixes, verify a new or extended unit test under `tests/unit/` covers at least one of them. If none of the fixes introduced an invariant worth testing, that is acceptable — but a diff with zero test touches across three or more fixes is a FAIL.

## 6. Working tree clean and pushed

- `git status` reports a clean working tree.
- `git log origin/master..HEAD` is empty — every iteration has been pushed (per `CLAUDE.md` push-on-every-iteration rule).

# Return format

Report which of the six criteria passed, which failed, and the concrete evidence for each (file paths, line numbers, command outputs). If any criterion fails, the loop must continue — a FAIL verdict with actionable detail is more useful than a narrow reason.
