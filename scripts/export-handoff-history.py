"""Extract project dialogue from explicitly selected local Codex rollouts, without tool payloads."""
import json, pathlib, re, sys

source = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parents[1] / 'docs/handoff/2026-09-12/history'
out.mkdir(parents=True, exist_ok=True)
threads = {
    '01a08d13-417a-7031-a01b-071623ac941a': 'art',
    '01a08d0f-e888-7e21-b2a2-a660147fb19a': 'wasteland',
    '01a044f9-7c8f-7cf1-b970-e708f71ad085': 'game',
}
for tid, name in threads.items():
    entries, seen, sources = [], set(), []
    for path in sorted(source.rglob('*' + tid + '*.jsonl')):
        sources.append(path.name)
        for line in path.open(encoding='utf-8'):
            row = json.loads(line)
            p = row.get('payload', {})
            if row.get('type') != 'response_item' or p.get('type') != 'message':
                continue
            role = p.get('role')
            if role not in ('user', 'assistant'):
                continue
            if role == 'assistant' and p.get('phase') not in ('final', 'final_answer'):
                continue
            body = '\n'.join(c.get('text', '') for c in p.get('content', []) if c.get('type') in ('input_text', 'output_text'))
            if role == 'user':
                if body.startswith(('<environment_context>', '<recommended_plugins>', '# AGENTS.md', '<permissions', '<skills')):
                    continue
                body = re.sub(r'<in-app-browser-context\b.*?</in-app-browser-context>', '', body, flags=re.S)
                body = re.sub(r'<environment_context>.*?</environment_context>', '', body, flags=re.S)
                body = body.replace('## My request:', '').strip()
            body = re.sub(r'data:image/[^\s)]+', '[inline image omitted; see project assets]', body)
            body = re.sub(r'\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})\b', '[REDACTED]', body)
            if not body.strip() or body in seen:
                continue
            seen.add(body)
            entries.append((row.get('timestamp', ''), role, body))
    entries.sort(key=lambda e: e[0])
    header = f'# {name}: project dialogue archive\n\nThread: `{tid}`. Exported 2026-09-12.\n\nHistorical evidence only: later user corrections and ACCEPTED.md supersede older answers. Includes user text and final assistant text from local main/continuation rollouts; excludes tool outputs, reasoning, images, ambient context and credentials. This is a readable archive, not a Codex database restore.\n\nSources:\n' + ''.join(f'- `{s}`\n' for s in sources)
    (out / (name + '.md')).write_text(header + '\n' + '\n\n'.join(f'## {t} | {r}\n\n{b}' for t, r, b in entries) + '\n', encoding='utf-8')
    print(name, len(sources), 'rollouts', len(entries), 'messages')
