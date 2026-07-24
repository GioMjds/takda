# Business Management — End-to-End Workflow

> Companion to `BUSINESS-MANAGEMENT-TASKS.md`. This file walks
> through the **operational** steps: branch creation, pushes,
> sub-issue branching, and how each sub-branch relates to a
> GitHub sub-issue of [#3](https://github.com/GioMjds/takda/issues/3).
>
> No code is written from this file. Run the commands in order.

---

## 0. The shape of the work

```
main
  │
  └── feat/business-management                  ← long-lived feature branch
        │                                        (umbrella for all 13 sub-issues)
        │
        ├── feat/business-module                ← sub-issue #1
        ├── feat/branch-module                  ← sub-issue #2
        ├── feat/employee-module                ← sub-issue #3
        ├── feat/staff-invitation-system        ← sub-issue #4
        ├── feat/business-settings              ← sub-issue #5
        ├── feat/working-hours                  ← sub-issue #6
        ├── feat/holiday-schedules              ← sub-issue #7
        ├── feat/service-categories             ← sub-issue #8
        ├── feat/service-management             ← sub-issue #9
        ├── feat/employee-assignments           ← sub-issue #10
        ├── feat/business-profile-page          ← sub-issue #11
        ├── feat/branch-management-ui           ← sub-issue #12
        └── feat/service-management-ui          ← sub-issue #13
```

**Why this shape, not one PR per sub-issue into `main` directly?**

- The 13 sub-issues share Prisma migrations, Zod schemas in
  `@takda/shared`, and `app.module.ts` wiring. If they land
  separately into `main`, the codebase is in a broken state
  between PRs.
- The umbrella `feat/business-management` branch is where we
  integrate. Each sub-branch merges **into the umbrella**, not
  into `main`. `main` only receives one big PR at the end (or
  a small set of reviewable chunks).
- The git history of the umbrella is a clean merge history
  showing the 13 sub-issues, which is what we want for review.

The `AGENTS.md` branch-naming rule (`<type>/<short-kebab-summary>`)
is satisfied; we just nest sub-branches under a feature branch.

---

## 1. Phase 0 — Pre-flight

Before any branching, run these checks locally.

```bash
# 1. Make sure you are on main, in sync with origin.
cd C:/Users/giomj/OneDrive/Desktop/takda
git checkout main
git pull --rebase origin main

# 2. Confirm gh is authenticated.
gh auth status

# 3. Confirm you can see the parent issue.
gh issue view 3 --repo GioMjds/takda
```

If `gh auth status` shows you as logged out, run:

```bash
gh auth login
```

Pick **GitHub.com → HTTPS → login with web browser**. After
auth completes, the `gh` CLI will pick up the session.

---

## 2. Phase 1 — Create and push the umbrella feature branch

This is the long-lived branch every sub-issue merges into.

```bash
# 1. Branch from main. (AGENTS.md: <type>/<short-kebab-summary>.)
git checkout -b feat/business-management

# 2. Commit the planning doc that the previous turn produced.
git add BUSINESS-MANAGEMENT-TASKS.md
git commit -m "docs(business): add Business Management task breakdown

Outlines the 13 sub-issues under #3, the file surface each
sub-issue will touch, and the dependency order. See
BUSINESS-MANAGEMENT-TASKS.md for the full plan."

# 3. Push the branch to GitHub and set upstream.
git push -u origin feat/business-management
```

After this, `feat/business-management` exists on the remote.
The parent issue (#3) is what every sub-issue links to.

**Optional but recommended** — open a **draft PR** from
`feat/business-management` into `main` *now*, even though
there's no code yet. Title it:

> WIP: Business Management umbrella (#3)

This PR is the integration target. Each sub-issue's PR will
target `feat/business-management`, and this umbrella PR is
where reviewers see the cumulative diff.

```bash
gh pr create \
  --base main \
  --head feat/business-management \
  --title "WIP: Business Management umbrella (#3)" \
  --body "Umbrella branch for the 13 sub-issues of #3. See BUSINESS-MANAGEMENT-TASKS.md for the breakdown. Sub-issue PRs will target this branch; this PR will be opened for real review once the milestone is complete." \
  --draft
```

> ⚠️ **Don't merge this PR yet.** It's a placeholder. The
> real merge happens after the last sub-issue lands.

---

## 3. Phase 2 — Create the 13 sub-issues on GitHub

You're doing this manually, but here's the order and the
template so the sub-issue bodies are consistent. Open
https://github.com/GioMjds/takda/issues/new for each one.

**For every sub-issue:**

| Field           | Value                                                                                                                |
|-----------------|----------------------------------------------------------------------------------------------------------------------|
| Title           | Copy from `BUSINESS-MANAGEMENT-TASKS.md` §2 (e.g. `Business module`, `Branch module`, …)                              |
| Body            | Copy the **Body** block from §2 of the planning doc                                                                   |
| Milestone       | `Business Management`                                                                                                |
| Labels          | `area:api`, `area:web`, and/or `area:shared` as listed in the sub-issue's Files block                                |
| Assignees       | yourself                                                                                                              |
| Parent issue    | Reference `#3` in the body (e.g. `Part of #3`)                                                                       |

**Order of creation:**

1. `Business module` (#1)
2. `Branch module` (#2) — depends on #1
3. `Employee module` (#3) — depends on #1
4. `Staff invitation system` (#4) — depends on #3
5. `Business settings` (#5) — depends on #1
6. `Working hours` (#6) — depends on #1
7. `Holiday schedules` (#7) — depends on #1, #6
8. `Service categories` (#8) — depends on #1
9. `Service management` (#9) — depends on #8
10. `Employee assignments` (#10) — depends on #3, #9
11. `Business profile page` (#11) — depends on #1, #5
12. `Branch management UI` (#12) — depends on #2
13. `Service management UI` (#13) — depends on #9

**After each creation**, GitHub assigns a number. Note them
in the table below as you go (you'll need them in Phase 3):

| #  | Sub-issue title                     | GitHub issue # (fill in) |
|----|-------------------------------------|--------------------------|
| 1  | Business module                     |                          |
| 2  | Branch module                       |                          |
| 3  | Employee module                     |                          |
| 4  | Staff invitation system             |                          |
| 5  | Business settings                   |                          |
| 6  | Working hours                       |                          |
| 7  | Holiday schedules                   |                          |
| 8  | Service categories                  |                          |
| 9  | Service management                  |                          |
| 10 | Employee assignments                |                          |
| 11 | Business profile page               |                          |
| 12 | Branch management UI                |                          |
| 13 | Service management UI               |                          |

### 3.1 Setting "Blocks" / "Blocked by" (optional but useful)

If you use GitHub Projects, you can encode the dependency
graph. From the project board, open each sub-issue and set
its "Blocked by" list per the order table above. The
umbrella issue #3 then has a visual "13 child issues"
indicator.

If you don't use Projects, the dependency order is enough —
just don't start a sub-issue until its dependencies' branches
have merged into `feat/business-management`.

---

## 4. Phase 3 — Create a sub-branch per sub-issue

For **each** sub-issue in the order above, do this loop. The
example below uses sub-issue #1 (Business module). Replace
`<N>` and the branch name for the others.

```bash
# 1. Make sure your local feat/business-management is current.
git checkout feat/business-management
git pull --rebase origin feat/business-management

# 2. Branch off the umbrella.
git checkout -b feat/business-module
#     ^^^^^^^^^^^^^^^^^^^^^^
#     replace per the sub-issue

# 3. Push the new branch and set upstream.
git push -u origin feat/business-module

# 4. Open a draft PR targeting feat/business-management (NOT main).
gh pr create \
  --base feat/business-management \
  --head feat/business-module \
  --title "feat(business): <copy sub-issue title here> (#<sub-issue-number>)" \
  --body "Closes #<sub-issue-number>. Part of #3.\n\nSee BUSINESS-MANAGEMENT-TASKS.md §2 sub-issue #<N> for the file surface and acceptance criteria." \
  --draft
```

The key bits:

- `--base feat/business-management` — the sub-issue PR
  targets the umbrella, **not `main`**.
- `Closes #<sub-issue-number>` — when the PR merges,
  GitHub auto-closes the sub-issue and the parent (#3)
  shows it as completed.
- `Part of #3` — links the sub-issue back to the parent
  for tracking.

### 4.1 Loop table

Run the loop for each of the 13 sub-issues. Concrete
branches and titles:

| #  | Sub-issue title              | Branch name                       | PR title                                                       |
|----|------------------------------|-----------------------------------|----------------------------------------------------------------|
| 1  | Business module              | `feat/business-module`            | `feat(business): Business module (#<N>)`                       |
| 2  | Branch module                | `feat/branch-module`              | `feat(business): Branch module (#<N>)`                         |
| 3  | Employee module              | `feat/employee-module`            | `feat(business): Employee module (#<N>)`                       |
| 4  | Staff invitation system      | `feat/staff-invitation-system`    | `feat(business): Staff invitation system (#<N>)`               |
| 5  | Business settings            | `feat/business-settings`          | `feat(business): Business settings (#<N>)`                     |
| 6  | Working hours                | `feat/working-hours`              | `feat(business): Working hours (#<N>)`                         |
| 7  | Holiday schedules            | `feat/holiday-schedules`          | `feat(business): Holiday schedules (#<N>)`                     |
| 8  | Service categories           | `feat/service-categories`         | `feat(business): Service categories (#<N>)`                    |
| 9  | Service management           | `feat/service-management`         | `feat(business): Service management (#<N>)`                   |
| 10 | Employee assignments         | `feat/employee-assignments`       | `feat(business): Employee assignments (#<N>)`                 |
| 11 | Business profile page        | `feat/business-profile-page`      | `feat(web): Business profile page (#<N>)`                       |
| 12 | Branch management UI         | `feat/branch-management-ui`       | `feat(web): Branch management UI (#<N>)`                       |
| 13 | Service management UI        | `feat/service-management-ui`      | `feat(web): Service management UI (#<N>)`                      |

> The `feat(business):` and `feat(web):` prefixes match the
> `<type>(<scope>):` conventional-commit style used elsewhere
> in the repo (see `AGENTS.md` §4.3 and recent log).

---

## 5. Phase 4 — Per-sub-issue workflow (the inner loop)

For each sub-issue, the inner loop is:

1. **Open the draft PR** (from §4). It is currently empty.
2. **Switch to the sub-branch** locally:
   ```bash
   git checkout feat/business-module
   ```
3. **Implement the work** described in
   `BUSINESS-MANAGEMENT-TASKS.md` §2 for that sub-issue.
   Follow the **Files** block exactly.
4. **Commit incrementally** (don't lump everything into one
   commit). Example sequence for sub-issue #1:
   ```bash
   # commit 1: shared contract first
   git add packages/shared/src/schemas/business.ts \
           packages/shared/src/constants/errors.ts
   git commit -m "feat(shared): add business Zod schemas and error codes (#<N>)"

   # commit 2: API service
   git add apps/api/src/businesses/
   git commit -m "feat(api): implement BusinessesService CRUD (#<N>)"

   # commit 3: API controller
   git add apps/api/src/businesses/businesses.controller.ts
   git commit -m "feat(api): add business REST endpoints (#<N>)"

   # commit 4: tests
   git add apps/api/src/businesses/__tests__/
   git commit -m "test(api): cover BusinessesService happy path + duplicate slug (#<N>)"
   ```
   Each commit's `(#<N>)` suffix references the sub-issue
   number, so the auto-close still works.
5. **Push and re-run the §4.4 checklist**:
   ```bash
   git push

   # DoD checks (root AGENTS.md §4.4):
   pnpm build                              # at the root
   pnpm typecheck                          # per app
   pnpm lint                               # per app
   pnpm test                               # for the touched workspace
   ```
6. **Mark the PR ready for review**:
   ```bash
   gh pr ready
   ```
7. **Self-review the diff** (`gh pr view --web` or in the
   browser) and request a reviewer.
8. **Merge into the umbrella** when the PR is green:
   ```bash
   # After approval, on GitHub: click "Merge pull request" with
   # "Squash and merge" or "Merge commit" — your call. The
   # sub-issue will auto-close.
   ```
9. **Update the parent issue #3** — check off the
   corresponding checkbox and link to the merged PR in a
   comment:
   ```bash
   gh issue comment 3 --body "✅ Sub-issue #<N> merged: <PR URL>"
   ```

### 5.1 Handling merge conflicts between sub-branches

Sub-issues that touch overlapping files (`packages/shared/src/schemas/index.ts`,
`packages/shared/src/constants/errors.ts`, `app.module.ts`)
will conflict. The order in §3 minimizes this:

- Sub-issues that touch the same file land in dependency
  order (e.g. #1 ships `business.ts` first, then later
  sub-issues rebase and pick it up).
- When a conflict appears:
  ```bash
  # On the sub-branch:
  git fetch origin
  git rebase origin/feat/business-management
  # Fix conflicts, then:
  git add <resolved files>
  git rebase --continue
  git push --force-with-lease
  ```
  After a rebase, GitHub's PR shows "This branch is out of
  date" and re-runs CI on the rebased commits.

---

## 6. Phase 5 — Closing the umbrella

When **all 13 sub-issue PRs are merged** into
`feat/business-management`:

1. **Update the umbrella PR** (the one opened in Phase 1
   with `--base main`). Push the final commit (or simply
   remove the `WIP:` prefix from the title):
   ```bash
   gh pr edit --title "feat: Business Management milestone (#3)" \
              --body "Closes #3. All 13 sub-issues merged. See BUSINESS-MANAGEMENT-TASKS.md for the breakdown."
   ```
2. **Open it for review** (it was a draft):
   ```bash
   gh pr ready
   ```
3. **Run the full DoD one more time** from `main`'s tip
   after the umbrella merges:
   ```bash
   git checkout main
   git pull
   pnpm install
   pnpm build
   pnpm typecheck
   pnpm lint
   pnpm test
   ```
4. **Merge the umbrella PR** into `main`.
5. **Delete the local + remote umbrella branch**:
   ```bash
   git branch -d feat/business-management
   git push origin --delete feat/business-management
   ```
6. **Delete the local sub-branches** (they're now in
   `main`'s history through the umbrella merge):
   ```bash
   for b in $(git branch --list 'feat/business-module' \
                              'feat/branch-module' \
                              'feat/employee-module' \
                              'feat/staff-invitation-system' \
                              'feat/business-settings' \
                              'feat/working-hours' \
                              'feat/holiday-schedules' \
                              'feat/service-categories' \
                              'feat/service-management' \
                              'feat/employee-assignments' \
                              'feat/business-profile-page' \
                              'feat/branch-management-ui' \
                              'feat/service-management-ui'); do
     git branch -d "$b"
   done
   ```

---

## 7. Cheat-sheet (the commands in one place)

```bash
# Phase 1 — umbrella
git checkout main && git pull --rebase origin main
git checkout -b feat/business-management
git add BUSINESS-MANAGEMENT-TASKS.md
git commit -m "docs(business): add Business Management task breakdown"
git push -u origin feat/business-management
gh pr create --base main --head feat/business-management \
  --title "WIP: Business Management umbrella (#3)" --draft

# Phase 3/4 — per sub-issue, repeat with the right names
git checkout feat/business-management && git pull --rebase origin feat/business-management
git checkout -b feat/<sub-branch>
git push -u origin feat/<sub-branch>
gh pr create --base feat/business-management --head feat/<sub-branch> \
  --title "feat(<scope>): <sub-issue title> (#<N>)" \
  --body "Closes #<N>. Part of #3." --draft

# ... do the work, push commits, run pnpm build/typecheck/lint/test ...

gh pr ready                                # when green
# merge via the GitHub UI
gh issue comment 3 --body "✅ Sub-issue #<N> merged: <PR URL>"

# Phase 5 — close out
gh pr edit --title "feat: Business Management milestone (#3)"
gh pr ready
# merge via GitHub UI
git checkout main && git pull
# delete umbrella + sub-branches (see §6)
```

---

## 8. Common pitfalls (and how to avoid them)

- **Don't open sub-issue PRs against `main`.** They will
  show up as "directly modifies the protected branch" and
  bypass the umbrella. Always `--base feat/business-management`.
- **Don't merge the umbrella PR early.** Once it's merged
  into `main`, all sub-issues target a deleted branch. The
  umbrella stays a draft until the very end.
- **Don't force-push the umbrella.** Sub-branches that
  rebased off it will silently lose their base. Only force-push
  the **sub-branch** you just rebased.
- **Don't commit `.env*`.** `AGENTS.md` §4.3 — keep them out
  of the diff.
- **Don't ship a sub-issue without a test.** `AGENTS.md` §4.4
  — the PR will be sent back.
- **Don't change the `packages/shared` API in one PR and the
  consumer in another.** `packages/shared/AGENTS.md` §3:
  shared is a wire contract; both sides update in the same PR.
- **Don't create a sub-issue that's already done.** Check the
  sub-issues already closed in this repo first — `gh issue
  list --state all --label area:api` to scan.

---

## 9. The artifact this workflow produces

When everything is done, GitHub shows:

- **Issue #3** (parent): all 13 checkboxes ticked, with
  each checkbox linked to the sub-issue PR comment.
- **13 sub-issues**: each closed by its own PR merge commit.
- **13 sub-branch PRs**: all merged into
  `feat/business-management` with `Closes #<sub-issue>` in
  the body.
- **1 umbrella PR**: `feat/business-management → main`,
  merged last, with the milestone closed.
- **`main`**: has one large commit (or one merge commit) that
  contains the entire Business Management milestone.

That's the deliverable.
