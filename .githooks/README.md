# Git hooks

To activate the repo-level hooks (so every commit auto-regenerates the
example zoos whenever src/ or examples/specs.json changes):

    git config core.hooksPath .githooks

The `pre-commit` hook runs `node scripts/precommit-zoos.mjs`, which:

1. Inspects the staged file list.
2. If any `src/`, `examples/specs.json`, `examples/edge-cases.json`, or
   zoo-generator script is staged, runs `npm run zoo:all` to regenerate
   all PNGs and READMEs.
3. `git add examples/` to include the regenerated artifacts in the commit.

If no rendering-affecting files are staged, the hook is a no-op.
