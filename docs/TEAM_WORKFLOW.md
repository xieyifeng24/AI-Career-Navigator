# Nexus — AI Career Navigator 五人远程协作规则

队名：Nexus。学校：XIAMEN UNIVERSITY MALAYSIA（厦门大学马来西亚分校）。团队人数：5 人。截图显示报名队长为 XIE YIFENG；职责沿用本项目已约定的分工。

## 职责与初始分支示例

| 成员 | 职责 | 分支示例 | 重点协作对象 |
| --- | --- | --- | --- |
| XIE YIFENG（我；Product Lead / 报名队长） | 产品逻辑、需求优先级、验收标准、AI 策略、比赛叙事 | feature/product-ai | Y、L、Z |
| YANG XUHUI（Y；Tech Lead） | 后端开发、技术方案、共享契约、协调代码集成 | feature/backend | 全员 |
| CHEN QIANYU（C；Frontend & UI/UX） | 前端、交互、视觉、响应式与可访问性 | feature/frontend | Y、Product Lead、Z |
| LAI HAILU（L；AI Engineer） | AI 模型、提示策略、推理与数据分析逻辑 | feature/ai-engine | Y、Product Lead、Z |
| ZHANG XINAO（Z；Research & QA） | 数据研究、来源与质量、测试、回归与验收证据 | feature/testing | 全员 |

这些职责不代表文件独占，也不等于 GitHub 用户名。Product Lead 的 GitHub 账号为 [@xieyifeng24](https://github.com/xieyifeng24)，其他成员实际账号由管理员邀请；不使用虚构账号配置 CODEOWNERS。分支只是示例，按具体任务建短期分支，不由本次配置自动创建。

## 每个任务的完整闭环

同步 main → 创建功能分支 → 使用 Codex 开发 → 本地测试 → Commit → Push → 创建 Pull Request → 自动检查 → 代码审核 → 合并 main。

main 始终保持稳定，不用于日常开发。详细 Desktop 和 Git 操作见 [CONTRIBUTING](../CONTRIBUTING.md)。任务先建 Feature Request 或 Bug Report，写清负责人、验收条件、依赖、优先级和预计时间；一个负责人推进，其他成员协助。尽早开 Draft PR 暴露方向和阻塞，完成后请求正式审核。

## 共享 API 和数据结构：先沟通再实施

任何共享请求/响应、字段类型、错误码、模型输入输出、数据库结构变更，必须先在 Issue 或契约文档说明：当前与拟议格式、示例、受影响调用方、兼容或迁移方案、测试计划。通知所有受影响成员，取得明确确认后再开发，并把讨论链接放入 PR。紧急修复也需要沟通，不先改后通知。

Y 协调接口一致性；C 确认前端调用影响，L 确认模型契约，Z 确认测试数据和回归范围，Product Lead 确认产品语义。破坏性变更必须协调上下游改动及合并顺序，不能依靠“对方之后会修”。不把真实用户数据放进测试。

## 远程节奏与审核

每个工作日异步更新：已完成、下一步、阻塞、PR/Issue 链接。遇到接口阻塞立即通知，不等待例会。交接说明当前分支、最新 commit、复现/测试命令和未完成事项。重要决定留在 Issue 或仓库文档中，聊天讨论也回填结论。

PR 尽量小且单一目的，至少一名非作者审核人批准；共享接口 PR 额外请求受影响成员审核。Y 负责协调集成而非承担全部审核。目标在一个工作日内响应审核请求；无人响应时在团队渠道协调。检查失败、冲突、未解决的审核意见或验收不清楚时不合并。合并后 Z 检查关键流程，缺陷开 Issue 跟踪。

## GitHub 管理员需要手动完成

1. 团队独立仓库已建立：https://github.com/xieyifeng24/AI-Career-Navigator ，当前公开。确认 main 为默认分支，邀请其他四人的实际 GitHub 账号。按比赛规则选择可见性。
2. 本地 origin 已关联团队仓库；通过配置分支 PR 导入协作文件，配置合入 main 后供全员作为起点。
3. 启用 Issues 和 GitHub Actions，允许本工作流使用 checkout、setup-python，Workflow permissions 采用只读。CI 不需要任何 Secret。
4. 为 main 建立 active ruleset 或 branch protection：必须通过 PR、至少 1 人批准、推送新改动后撤销旧批准、讨论全部解决、要求分支更新、要求 `Python unit tests` 和 `Prototype JavaScript tests` 状态检查通过、禁止 force push 和删除 main；限制绕过权限，管理员也遵守。先跑一次 PR，才可能在界面选到检查名称。若当前仓库套餐或可见性不支持强制规则，需要调整方案；本地文件不会自动启用保护。
5. 建议启用 Squash merge 和自动删除已合并分支；启用可用的 Secret scanning / Push protection。保护功能是否可用以仓库界面和套餐为准。
6. 将真实运行密钥放在 Replit Secrets、RunPod 等对应平台；将来确有 CI 集成测试时再配置受限的 Actions Secrets，并另行设计外部调用与费用控制。

初始配置 PR 是保护设置完成前的引导步骤，由管理员人工审核，不将其作为后续绕过保护的惯例。团队仓库与 origin 关联已完成；配置 PR、自动检查及合并状态以 GitHub 页面为准。

## 比赛提交检查

Product Lead 负责团队信息、赛道及演示叙事；Y 协调可运行版本与部署说明；C 提供界面和演示素材；L 提供 RunPod 技术说明；Z 核对 README 清单、运行步骤及证据文件。保留官方目录、.replit、LICENSE 和提交 PDF。官方 README 链接的 Google Drive 材料仍需团队单独下载并核对；本套流程不代替赛事要求验证。
