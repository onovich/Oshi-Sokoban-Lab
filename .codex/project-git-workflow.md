<!-- codex-project-git-workflow: initialized -->
<!-- initialized-at: 2026-08-28 12:50:12 +08:00 -->

# Codex Git Workflow

Initialization status: initialized
Project: LearnSokoban
Repository root: D:\LabProjects\LearnSokoban
Machine config: `
.codex\project-git-workflow.json
`
Skill: project-git-workflow

Treat this document and the machine config as the source of truth for this repository's Codex git workflow. Do not replace them with generic defaults unless the user explicitly asks to reinitialize or update the policy.

## Global Wrappers

Run these from the repository root:

```
powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Validate.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Commit.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Push.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Stash.cmd -StashMessage "reason"
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\StashPop.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Ignore.cmd -Pattern build-output/
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\DiscardPaths.cmd -ConfirmDangerous -Paths path\to\file
```

## Status

```
powershell
git -c safe.directory=D:/LabProjects/LearnSokoban status --short --branch
```

## Validation

Run these before commit or push, in order:

```powershell
npx vitest run --maxWorkers=2
```

```powershell
npm run typecheck
```

```powershell
npm run build
```

## Staging Policy

2026-09-12: validation also runs both independent 3D Node test suites and both Vite experiment builds, as listed in the machine config. Main Vitest excludes experiments because those suites use node:test.

selected files only

Inspect status before staging. Preserve unrelated user changes unless the user explicitly asks to include them.

## Commit

Use the global wrapper's built-in git commit after staging according to policy. Prefer concise conventional commit messages unless the user specifies another message.

## Push

```
powershell
git -c safe.directory=D:/LabProjects/LearnSokoban push -u origin HEAD
```

## Docs And TODO

None configured.

## Safety And Branch Policy

Do not force-push or run destructive reset without explicit user approval.
