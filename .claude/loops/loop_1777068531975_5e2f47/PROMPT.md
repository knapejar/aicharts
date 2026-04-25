# Goal

Guarantee every aicharts chart renders correctly **for any valid input**, not only the 70 curated zoo fixtures. The product owner suspects the programmer has been tuning code so that specific fixtures look right, and demands proof the fixes generalize. This loop runs a hostile programmer-plus-critic cycle: on every iteration a critic agent **in a bad mood** examines fresh random adversarial renders, and a programmer fixes defects in `src/` (never in fixtures). The loop ends when three consecutive rounds find zero defects.

# Read first

- `CLAUDE.md` at the repo root — architecture, conventions, push-and-auth workflow, and the full PO complaint log. The log lists the bug classes the critic should suspect first.
- `src/core/frame.ts` — single source of truth for bounding boxes. Any hand-rolled layout inside a chart module is already a regression.
- `src/charts/` — thirteen chart modules. All go through `computeFrame`.

# Loop directory

Absolute path: `/home/jarda/clay-projects/mcp-charts/.claude/loops/loop_1777068531975_5e2f47`

Everything the loop produces (STATE.json, adversarial generator, renders, critic reports) lives here. Keep this directory tidy — the judge reads it.

# State file

`STATE.json` in the loop directory tracks progress across iterations.

```json
{
  "clean_rounds": 0,
  "target_clean_rounds": 3,
  "loop_started_at": "2026-04-25T00:00:00Z",
  "last_iteration": 0,
  "iterations": [
    {
      "iter": 1,
      "seed": 1714003200000,
      "timestamp": "2026-04-25T12:00:00Z",
      "bugs_found": 4,
      "bugs_fixed": 4,
      "files_changed": ["src/charts/line.ts", "src/core/frame.ts"],
      "critic_report": "renders/round-1/critic-report.json"
    }
  ],
  "fixes_applied": [
    { "iter": 1, "category": "overlap", "description": "...", "files": ["..."] }
  ]
}
```

On the first iteration create it with `clean_rounds: 0`, `target_clean_rounds: 3`, `loop_started_at: <now ISO>`, `last_iteration: 0`, and empty arrays.

# Per-iteration workflow

Every iteration is a fresh session. Perform the steps in order, no shortcuts.

## 1. Orient

- `git log -15 --oneline` to see recent work.
- Read `STATE.json`. If missing, initialise it.
- If `clean_rounds >= target_clean_rounds`, do nothing and exit — the judge will pass.
- Otherwise, note the next iteration number = `last_iteration + 1`.

## 2. Build

- `npm run build` must succeed. Fix any TypeScript or esbuild error before continuing — a broken build is a defect by itself.

## 3. Generate adversarial inputs

Write (or overwrite) `adversarial-gen.mjs` in the loop directory. Seed with current epoch millis so every round differs. Produce **12 specs** that collectively cover:

- Every chart type at least once: line, bar (horizontal + vertical), stacked-area, stacked-bar (horizontal + vertical), grouped-bar, combo, pie, donut, bar-split, line-split, geo.
- Each aspect size (`share`, `square`, `poster`) at least four times.
- Random palette picked from the 10-palette registry (`editorial`, `clarity`, `boardroom`, `mono-blue`, `vibrant`, `earth`, `twilight`, `carbon`, `diverging-sunset`, and one more — list them from `src/palettes/index.ts`).
- Pathological parameter combinations drawn at random each time:
  - Very long titles and subtitles (100+ chars).
  - Single data point, two points, forty points.
  - Zero data.
  - All-same values (zero range).
  - Huge dynamic range (1e-3 to 1e9).
  - Negative values, values crossing zero.
  - 20+ slices / categories (pie, bar).
  - Percent values pre-scaled to 0..100 AND as fractions 0..1.
  - Non-year integer x-axis (round numbers).
  - Special characters in labels (é, &, ', long institution names).
  - Missing optional fields (no subtitle, no source, no logo).
  - Multi-word series / legend entries.
- Render all 12 with the built library (`import { render } from '../../../../dist/index.js'`) into `renders/round-<N>/adversarial/*.png`.

Also copy five randomly selected existing zoo PNGs from `examples/charts/`, `examples/charts-square/`, and `examples/charts-portrait/` into `renders/round-<N>/sampled/` — the critic must review those too so we keep an eye on the shipping zoo.

## 4. Spawn the critic subagent

Use the `Agent` tool, `subagent_type: "general-purpose"`. The prompt must:

- Set the persona explicitly: **"You are a critic agent in a bad mood. The product owner does not trust the programmer. Assume every chart is broken until proven otherwise. Hand-waving like 'looks fine' is unacceptable."**
- Point the critic at every PNG in `renders/round-<N>/` (both `adversarial/` and `sampled/`). The critic uses Claude vision — pass each image path to the `Read` tool and inspect the rendered chart.
- Require per-image verdicts using the bug taxonomy below.
- Require structured output written to `renders/round-<N>/critic-report.json`:

  ```json
  {
    "round": 5,
    "seed": 1714003200000,
    "images_reviewed": 17,
    "clean": false,
    "bugs": [
      {
        "image": "renders/round-5/adversarial/08-pie-20-slices.png",
        "chart_type": "pie",
        "aspect": "portrait",
        "category": "overlap",
        "severity": "high",
        "description": "Sidebar legend (right) overlaps the donut ring between y=540 and y=610.",
        "evidence": "Ring outer edge sits at x≈720; first legend swatch sits at x≈705."
      }
    ],
    "summary": "3 high, 1 medium, 0 low"
  }
  ```

- `clean === true` is allowed only when the critic can state, for every image, that no high- or medium-severity defect exists.

## 5. Decide

Read `critic-report.json`.

- If `clean === true` and zero `high`/`medium` bugs:
  - Increment `STATE.json.clean_rounds` by 1.
  - Update `last_iteration`, append the iteration record with `bugs_found: 0`, `bugs_fixed: 0`, `files_changed: []`.
  - Commit with message `chore(loop): clean round <clean_rounds>/3 (seed <seed>)`.
  - Skip step 6.
- Otherwise:
  - Reset `STATE.json.clean_rounds` to 0.
  - Proceed to step 6.

## 6. Fix defects in `src/`

For every `high` or `medium` defect:

1. Trace to the root cause — usually `src/core/frame.ts`, `src/charts/axes.ts`, or the specific chart module. If the defect appears on multiple chart types, fix it once in the shared layout.
2. **Anti-cheating rules — non-negotiable. Violating any of these is worse than doing nothing:**
   - Do NOT add any adversarial spec to `examples/specs.json` or `examples/edge-cases.json`. The judge greps for that and fails the loop.
   - Do NOT hardcode values keyed off a specific title, palette, series name, or data shape from the adversarial inputs.
   - Do NOT silence the critic by adjusting fonts / margins only until the one failing case passes — the fix must hold for the whole matrix.
   - If the fix introduces a new invariant, back it with a unit test under `tests/unit/` (extend `frame.test.mjs`, `text-bounds.test.mjs`, or add a chart-specific test).
3. `npm run build && npm run zoo:all` — the full zoo must still render without errors, and no existing zoo PNG may regress obviously. Spot-check a few PNGs under `examples/charts-square/` if you touched shared layout.
4. Append this iteration to `STATE.json.iterations` with `bugs_found`, `bugs_fixed` (should equal `bugs_found`), `files_changed`, and one entry per fix in `fixes_applied`.
5. Commit with a descriptive message of the fix itself (e.g., `fix(layout): stop pie outside-labels duplicating sidebar legend`). Do NOT use a generic "loop iteration" message.

## 7. Push every iteration

Per `CLAUDE.md` §Workflow non-negotiables:

```
gh auth switch -u knapejar
git -c user.email=jak3679@gmail.com -c user.name="Jarda Knap" commit ...
git push origin master
```

The PO reviews on GitHub and needs the latest commit visible. Do not wait for "please push".

# Bug taxonomy

## Severity `high` — resets the clean-round counter

- **Overlap**: any two of {title, subtitle, legend, plot painting, y-tick labels, x-tick labels, source, logo} overlap visually even by 1 px.
- **Clipping**: text or data painting extends past the canvas edge or past its designated bounding box.
- **Truncation without ellipsis**: text cut mid-word with no visible ellipsis.
- **Unreadable**: font plainly too small to read at a 2× phone downscale.
- **Data missing**: a data point, bar, or slice silently absent when the input expected it.
- **Scale wrong**: y-axis clearly fails to span the data range, pie slices don't sum visually, or geo choropleth has blank countries where data exists.

## Severity `medium` — also resets the counter

- Asymmetric left/right margins (plot painting floats off-center).
- Axis tick label crowds into footer or subtitle zone.
- Legend wraps to a position that touches or passes the plot.
- Inline series label collides with value label at endpoint.
- Pie / donut sidebar legend duplicates the outside labels.
- First or last x-tick label hangs over the edge of the plot.
- Y-axis bottom-most tick collides with source line.
- Rotated x-axis labels spill into the footer.

## Severity `low` — log but do not reset the counter

- Subjective colour choice.
- Slightly uneven whitespace.
- Opinion-level style preferences.

The critic must use these exact category names so the programmer can grep them.

# Historical bug classes (from the PO complaint log)

Check each round that none of these regressed:

- Legend overlapping subtitle (`reservedHeaderHeight` under-estimate).
- Huge category names on horizontal bars clipping past left edge.
- Rotated x-labels invading the source footer.
- Pie / donut sidebar legend duplicating outside labels.
- First / last x-tick labels hanging over plot edge.
- Line chart endpoint value label colliding with inline series label.
- Bottom y-tick colliding with source (`-0.5` case).
- Horizontal bar not reaching the right edge (asymmetric value-label gutter).
- Stacked-area finger-shaped protrusions at left/right edges.
- Percent formatter misclassifying fractions vs. already-scaled percentages.

# Commit etiquette

Per `CLAUDE.md`: English only, no emoji, Prettier defaults. Inline git identity: `git -c user.email=jak3679@gmail.com -c user.name="Jarda Knap" commit -m "..."`. Push via the `knapejar` account.

# Completion

The loop ends when `STATE.json.clean_rounds >= 3`. The judge verifies the state file, the commit history, and the anti-cheating rules before passing.
