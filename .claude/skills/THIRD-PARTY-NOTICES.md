# Third-party skills in this folder

Copied unchanged from their upstream repositories after a read-through of every
file. No installer, hook or script from them was run. To update one, copy the
newer upstream `SKILL.md` over it and read the diff first.

| Skills | Source | Version / commit | License |
| --- | --- | --- | --- |
| ponytail, ponytail-audit, ponytail-debt, ponytail-gain, ponytail-help, ponytail-review | https://github.com/DietrichGebert/ponytail | v5.3.2 / 09c434ab73ca | MIT, (c) 2026 DietrichGebert |
| i-have-adhd | https://github.com/ayghri/i-have-adhd | v0.4.1 / 1ecea1993b7f | MIT, (c) 2026 Ayoub Ghriss |
| find-skills | https://github.com/vercel-labs/skills | v1.7.4 | see upstream |

Only the skill files are here, not the Ponytail and i-have-adhd plugins. Their
hooks would make the modes always-on, and plugins do not load in cloud sessions
anyway. Use `/ponytail` and `/i-have-adhd` to switch a mode on.

Not copied here. Install them yourself as plugins from Anthropic's official
marketplace, which pins a reviewed version:

- **Claude Security** (`claude plugin install claude-security@claude-plugins-official`):
  its license does not allow redistribution.
- **Superpowers** (`claude plugin install superpowers@claude-plugins-official --scope local`,
  run inside the project folder; obra/superpowers v7.0.0): ships helper scripts
  and a SessionStart hook, so it belongs in the plugin system, not copied into
  the repository.

## Ponytail license

```
MIT License

Copyright (c) 2026 DietrichGebert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## i-have-adhd license

```
MIT License

Copyright (c) 2026 Ayoub Ghriss

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
