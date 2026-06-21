---
title: "Jour 52"
date: "2026-06-21"
excerpt: "Agent Eve pour Discord, hooks Claude Code sur le repo backend, et victoire du Japon 4-0 face à la Tunisie — je soutiens la France pour cette Coupe du monde."
author: "Tony Duong"
category: "daily"
tags: ["eve", "vercel", "agents", "discord", "tech-watch", "open-source", "ai", "claude-code", "hooks", "lint", "macos", "football", "japan", "world-cup", "france"]
coverImage: "/images/blog/daily-cover.jpg"
---

## Aujourd'hui, j'ai :

- construit un agent de veille techno qui m'envoie un digest quotidien sur mon canal Discord privé avec le nouveau framework d'agents Eve de Vercel — [smart-digest-market-intelligence-eve](https://github.com/tonystrawberry/smart-digest-market-intelligence-eve) ; la génération et la livraison du digest fonctionnent bien, mais je dois encore affiner les sources tech et d'où récupérer l'info
- lu la [référence des hooks Claude Code](https://code.claude.com/docs/en/hooks) et ajouté des hooks sur le repo backend — `PostToolUse` sur `Edit|Write` lance le lint et des checks supplémentaires via `post_edit.sh`, et `Stop` envoie une notification macOS native quand Claude a fini de répondre
- regardé le Japon battre la Tunisie 4-0 🇯🇵 — ils sont trop forts, je pense qu'ils gagneront une Coupe du monde un jour, mais cette année j'espère que la France la remporte

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

> 🌐 *Traduit par Claude*
