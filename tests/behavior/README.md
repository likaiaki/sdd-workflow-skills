# 技能行为试用材料

这些是 0.4.0 的合成隔离样例，不是业务项目或产品验收结果。`npm test` 运行安装和资源检查，不自动重演 LLM 行为。

| 样例 | 入口与原始任务 | 本次观察 |
| --- | --- | --- |
| design | sdd-design；使用该目录 requirements.html 形成技术方案 | 使用已有 HTML 词典和真实代码映射，未新建词典；未知保证留草稿 |
| qa | sdd-acceptance；按 handoff.md 仅准备验收用例 | 沿用 r1 与 export-build-1，未把未确认 r2 用作旧版本预期 |
| model | domain-modeling；完成 request.md 指定咨询 | 区分两个业务范围的账户，候选完成规则未覆盖 r1 |
| simple | sdd-implement；修复 issue.md | 一行格式修复，既有两测试通过，无新增词典或完整文档 |
| bug | sdd-implement；从已选实施阶段修复 issue.md | 原入口暴露租户 0 失败，针对性修复后五测试通过 |
| review | sdd-review-code；从 base 到最终工作区，含全部未提交改动 | 四项缺陷均被定位，既有弱测试被识别且未伪装成新增缺陷 |

所有输入快照位于 [fixtures/](fixtures/)，其中 simple／bug 的根目录是修复后内容，`before/` 保存被修改文件的原版。review 的 base／head／index 保存同一文件在不同 Git 阶段的内容，根目录保存实际终点。

需要复跑时，先将目标样例复制到新的临时目录，再恢复相应 before 文件；保持原任务范围。review 在临时仓库依次提交 base、提交 head、暂存 index、写回根目录终点并保留 lookup.py 未跟踪，使用实际新建的基线提交作比较起点。不要把示例提交 SHA 当作新仓库可用引用。

独立行为评估时只给新上下文技能、任务和原始材料，不提供上表结果或预期修复；源技能包只读，所有产物限临时工程。需要人决定时保留问题，不虚构确认，不向真实用户发出合成任务提问，不运行产品 UI／真实 E2E，不推送或提交真实项目。

已观察结果与限制见 [验证记录](../../docs/verification-v0.4.0.md)，归档产物见 [行为样例](../../docs/behavior-examples/inventory.json)。分发报告仅归一化本机源路径和结尾空行，原输出和分发副本指纹均保留；不把路径整理声称为再次运行。
