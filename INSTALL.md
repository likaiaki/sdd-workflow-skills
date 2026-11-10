# 命令安装指南

本仓库采用标准 Agent Skills 目录，整包包含九个 `sdd-*` 技能与 `grilling`。安装使用已有工具完成，支持项目与用户两个范围。

本文命令以 `skills@1.7.6` 和 GitHub CLI `2.98.0` 的实际行为为基线，核对日期为 2026-11-10。安装目录和资源完整性检查与各 Agent 会话运行记录分别判断。

## 使用 skills CLI

需要 Git，以及 Node.js 22.20.0 或更新版本。`npx` 首次使用会下载固定版本的安装器。

先查看仓库可发现的技能。

```bash
npx skills@1.7.6 add likaiaki/sdd-workflow-skills --list
```

选择一个 Agent 全局安装。

```bash
npx skills@1.7.6 add likaiaki/sdd-workflow-skills --skill '*' --agent codex --global
```

在项目目录执行下面的命令，为团队项目安装。

```bash
npx skills@1.7.6 add likaiaki/sdd-workflow-skills --skill '*' --agent codex
```

多个 Agent 可以写在同一个 `--agent` 后面。

```bash
npx skills@1.7.6 add likaiaki/sdd-workflow-skills --skill '*' --agent codex claude-code cursor opencode gemini-cli github-copilot --global
```

普通终端通常保留安装器的交互提示；安装器检测到 Agent 环境时可能自动采用非交互模式，执行前应核对覆盖范围。普通终端需要明确跳过提示时可追加 `--yes`。`--skill '*'` 必须保留引号，避免终端将星号展开为当前文件列表。该参数安装本仓库全部十个技能目录，包含阶段间相对引用所需的资源。

### Agent 标识与落盘位置

以下为固定版本安装器的实际目标目录。项目路径相对执行命令的目录，全局路径以默认个人目录为例，工具专用配置可改变其位置。

| Agent | `--agent` | 项目路径 | 全局路径 |
| --- | --- | --- | --- |
| Codex | `codex` | `.agents/skills/` | `~/.agents/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.agents/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.agents/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.agents/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.agents/skills/` |
| Amp | `amp` | `.agents/skills/` | `~/.agents/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Roo Code | `roo` | `.roo/skills/` | `~/.roo/skills/` |
| Continue | `continue` | `.continue/skills/` | `~/.continue/skills/` |
| Kiro CLI | `kiro-cli` | `.kiro/skills/` | `~/.kiro/skills/` |
| Qoder | `qoder` | `.qoder/skills/` | `~/.qoder/skills/` |
| Trae | `trae` | `.trae/skills/` | `~/.trae/skills/` |
| Qwen Code | `qwen-code` | `.qwen/skills/` | `~/.qwen/skills/` |
| Kimi Code CLI | `kimi-code-cli` | `.agents/skills/` | `~/.agents/skills/` |

固定版本会让多个通用 Agent 共用 `.agents/skills`。因此表中的 Cursor、Gemini CLI、OpenCode 等可能使用共享目录，厂商原生目录还可存在其他选择。Claude Code 等独立目录在跨目录安装时通常通过符号链接连接到共享副本；单一目标目录默认复制。需要明确复制文件时追加 `--copy`。

Kiro 的自定义 Agent 可能需要在其资源配置中显式引用技能。当前安装器的更多标识见[固定版本支持表](https://github.com/vercel-labs/skills/blob/7a5e920bead4b1039a6d6df5d7e1163b7b09423a/docs/agents.md)，各宿主的能力和调用语法以其当前配置为准。

### 已有技能、升级和移除

安装器会清理并重建所选技能的同名目录。重复安装可刷新整套资源，本地自行修改及不同来源的同名技能需要先备份核对。`grilling` 也属于该名称冲突范围。多个 Agent 共用目录时，一次目录修改对这些 Agent 都生效。

升级本套件时，重新执行原来的整包 `add` 命令，保留明确的 Agent 清单、范围和复制选项。这样会一起更新各阶段和共享引用。

查看安装状态。

```bash
npx skills@1.7.6 list --global --json
npx skills@1.7.6 list --json
```

按来源锁记录筛选通过此安装器安装的全局套件并卸载，未命中的其他技能保留。

```bash
npx skills@1.7.6 remove likaiaki/sdd-workflow-skills --global
```

项目范围省略 `--global`。安装器依据自己的来源锁记录选择本套件的技能名，包含同来源的 `grilling`，随后移除相应目录中的同名技能。其他 Agent 目录内即使存在不同来源的同名副本，也可能一并移除；可以追加 `--agent codex` 等参数限制工具范围，执行前仍需检查目标。移除共享目录的技能会影响其他读取该目录的 Agent。

`check` 和 `update` 按准确技能名筛选，现有版本不会保留每项技能原来的 Agent 选择。整套更新推荐使用上面的 `add` 路径。若需要单项检查，可执行下面的命令。

```bash
npx skills@1.7.6 check sdd-workflow --global
```

### 固定仓库提交

团队可以将仓库的完整 40 位提交 SHA 写入 `#ref`，固定所采用的技能内容。将下面的占位值替换为 GitHub 仓库中真实存在的提交。

```bash
npx skills@1.7.6 add 'likaiaki/sdd-workflow-skills#<完整提交SHA>' --skill '*' --agent codex --global
```

安装器版本与技能仓库提交是两个独立版本。本文使用的 `skills@1.7.6` 中，仓库后的 `@名称` 用于技能名称选择，固定 Git ref 应使用 `#ref`。

## 使用 GitHub CLI

已安装带 `gh skill` 子命令的 GitHub CLI 时，可直接安装完整套件。本次验证使用 2.98.0，该命令仍处于公开预览阶段。先用 `gh skill install --help` 检查本机选项。

```bash
gh skill install likaiaki/sdd-workflow-skills --all --agent codex --scope user
```

项目范围使用 `--scope project`。指定某个版本可追加 `--pin <完整提交SHA>`。`--all` 在此表示安装仓库的全部技能；Agent 与安装范围由单独参数决定。

GitHub CLI 会在 `SKILL.md` 的 frontmatter 中加入来源追踪元数据。更新使用其自身的 `gh skill update` 命令，具体行为按本机帮助查看。同一安装位置选定一种工具管理，便于维护来源记录。

### Cline 的明确目录安装

Cline 当前官方文档列出 `.cline/skills/` 和 `~/.cline/skills/`。固定版本 `skills` CLI 将 `cline` 映射到共享目录，因此这里使用 GitHub CLI 的自定义目录选项写到明确的原生位置。

```bash
# 在项目目录中安装
gh skill install likaiaki/sdd-workflow-skills --all --dir .cline/skills

# 当前用户全局安装
gh skill install likaiaki/sdd-workflow-skills --all --dir "$HOME/.cline/skills"
```

### Antigravity 的明确目录安装

新版 Antigravity 当前官方全局目录为 `~/.gemini/config/skills/`。使用指定目录安装可直接对应这一位置。

```bash
gh skill install likaiaki/sdd-workflow-skills --all --dir "$HOME/.gemini/config/skills"
```

项目安装可使用共享 `.agents/skills/`。Standalone IDE 等旧版本还有兼容目录，应按实际使用的产品与版本核对。

### 从本地克隆安装

离线准备好仓库副本后，两个安装器都能复制本地技能。以下命令在目标项目中执行，源路径替换为实际克隆位置。

```bash
npx skills@1.7.6 add /path/to/sdd-workflow-skills --skill '*' --agent codex claude-code
gh skill install /path/to/sdd-workflow-skills --from-local --all --dir .cline/skills
```

安装器本身需要已准备在本机。本地来源的记录与远程仓库来源记录不同，后续刷新应继续使用明确的源路径。

## 运行仓库兼容性检查

```bash
npm ci --ignore-scripts
npm test
```

测试在临时工程和模拟用户目录中运行真实安装器，核对十个技能、完整资源、相对引用、重复安装、复制／链接、更新和移除边界。实际 Agent 会话的运行能力按各自执行证据判断。检查范围记录在 [verification.md](docs/verification.md)。

## 依据

- [skills CLI 固定版本源码](https://github.com/vercel-labs/skills/tree/7a5e920bead4b1039a6d6df5d7e1163b7b09423a)。
- [GitHub CLI 安装说明](https://cli.github.com/manual/gh_skill_install)。
- [Codex 本地技能发现](https://learn.chatgpt.com/docs/build-skills)。
- [Claude Code skills](https://code.claude.com/docs/en/skills)。
- [Cursor skills](https://cursor.com/docs/skills)。
- [OpenCode skills](https://opencode.ai/docs/skills/)。
- [Gemini CLI skills](https://geminicli.com/docs/cli/skills/)。
- [GitHub Copilot skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)。
- [Cline skills](https://docs.cline.bot/customization/skills)。
- [Amp skills](https://ampcode.com/docs/customize/skills)。
- [Antigravity skills](https://antigravity.google/docs/skills/)。
