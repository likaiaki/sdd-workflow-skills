# 依赖记录

## grilling

`skills/grilling/SKILL.md` 是本套件需求澄清所引用的既有依赖，导出时保留原文件内容。

- 文件 SHA-256 为 `fa5c1e5ee76b1c8f1ae56101f52c9e239de75d5c578adc61227b92d10b7e52ef`。
- 现有本地资料仅包含该 `SKILL.md`，没有附带上游地址、作者或许可证文件。
- 本仓库按现有副本记录来源状态，后续取得上游资料时可补充归属和许可信息。

## domain-modeling

该入口依据 Matt Pocock 的领域建模方法加入 SDD 适配：复用项目术语位置、候选与确认状态、目标与现状基线，以及技术名称映射。适配入口不是上游原文的同文件复制。

- 上游仓库：[mattpocock/skills](https://github.com/mattpocock/skills)。
- 固定提交：`4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`。
- `skills/domain-modeling/references/upstream-domain-modeling.md` 保存该提交的 `skills/engineering/domain-modeling/SKILL.md` 原文。
- 同目录 `GLOSSARY-FORMAT.md`、`ADR-FORMAT.md` 保留上游对应文件原文。上游默认路径和即时写入示例按适配入口与项目约束使用。
- 许可为 MIT，版权为 `Copyright (c) 2026 Matt Pocock`，完整声明保存在 `skills/domain-modeling/LICENSE.upstream`。
- 原文、参考资料、许可及适配入口的文件指纹见 `bundle-manifest.json`。没有另外导入上游的访谈、实现、审核或后台代理流程。

本轮调试、测试、审核、任务与维护方法亦参考同一仓库已读技能，结合现有 SDD 规则重写；未复制其默认执行工作流。版本清单记录九个 SDD skill、grilling 和 domain-modeling 的资源指纹；此处记录的第三方许可不为整个套件另行声明统一许可证。
