---
title: "52日目"
date: "2026-06-21"
excerpt: "Discord用Eveダイジェストエージェント、Claude Code hooksドキュメント、バックエンドrepoにPostToolUse lint + Stop macOS通知を追加。"
author: "Tony Duong"
category: "daily"
tags: ["eve", "vercel", "agents", "discord", "tech-watch", "open-source", "ai", "claude-code", "hooks", "lint", "macos"]
coverImage: "/images/blog/daily-cover.jpg"
---

## 今日やったこと：

- Vercelの新しいEveエージェントフレームワークで、テックウォッチ用のエージェントを構築 — プライベートDiscordチャンネルに日次ダイジェストを送る [smart-digest-market-intelligence-eve](https://github.com/tonystrawberry/smart-digest-market-intelligence-eve)；ダイジェストの生成と配信は問題なく動いているが、テックソースとニュースの取得元はまだ改善が必要
- [Claude Code hooks リファレンス](https://code.claude.com/docs/en/hooks) を読み、バックエンドrepoにhooksを追加 — `Edit|Write` の `PostToolUse` で `post_edit.sh` 経由のlintと追加チェック、`Stop` でClaudeの応答完了時にmacOSネイティブ通知

### `.claude/hooks/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post_edit.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude is done\" with title \"Claude Code\"' 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### `.claude/hooks/post_edit.sh`

```bash
#!/usr/bin/env bash
# PostToolUse hook — fires after every Edit or Write tool call.
#
# Reads a JSON blob from stdin with the structure:
#   { "tool_input": { "file_path": "/absolute/path/to/file" }, ... }
#
# Behaviour by file type:
#   *.rb                          → rubocop --autocorrect (style fixes in-place)
#   app/javascript/**/*.{js,jsx,ts,tsx,vue} → eslint --fix via root node_modules
#   vue3/**/*.{js,ts,vue}         → eslint --fix via vue3/node_modules
#   *.schema.json                 → validates JSON syntax, warns on parse error
#   */Gemfile                     → reminds developer to run bundle install

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Nothing to do if no file path was found in the tool input
[[ -z "$FILE" ]] && exit 0

if [[ "$FILE" == *.rb ]]; then
  # Autocorrect safe cops only; unsafe cops require explicit --autocorrect-all
  bundle exec rubocop --autocorrect "$FILE" 2>/dev/null || true

elif [[ "$FILE" =~ app/javascript/.*\.(js|jsx|ts|tsx|vue)$ ]]; then
  # Legacy Vue 2 frontend — ESLint config lives at repo root
  ./node_modules/.bin/eslint --fix "$FILE" 2>/dev/null || true

elif [[ "$FILE" =~ vue3/.*\.(js|ts|vue)$ ]]; then
  # Vue 3 migration — separate ESLint config and node_modules under vue3/
  (cd vue3 && ./node_modules/.bin/eslint --fix "$FILE" 2>/dev/null) || true

elif [[ "$FILE" == *.schema.json ]]; then
  # Schema sidecars are consumed by rails-openapi-generator; invalid JSON
  # causes silent generator failures that are hard to trace back
  python3 -m json.tool "$FILE" > /dev/null 2>&1 || echo "⚠️  Invalid JSON in $FILE"

elif [[ "$FILE" =~ /Gemfile$ ]]; then
  # Gemfile.lock is excluded by the regex anchor on /Gemfile$
  echo "⚠️  Gemfile edited — run: bundle install"
fi
```

---

> 🌐 *Claudeによる翻訳*
