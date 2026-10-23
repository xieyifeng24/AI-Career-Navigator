# 三来源职业知识库：实现与启用状态

2026-10-22，分支 `codex/dynamic-career-database`。沿用本地优先测评、既有五职业示例范围、评分规则、问卷与页面。不是全行业职业库，也不是经验证的职业成功预测。

## 实际接入状态

| 来源 | 实际渠道和结果 | 地区 / 限制 |
|---|---|---|
| O*NET | 已从官方 Database 页发现 31.0 CSV 下载地址，成功导入 5 职业；Occupation Data、Essential Skills、Transferable Skills、Abilities、Task Statements、Job Zones、Job Zone Reference、Scales Reference | 美国职业背景；保留原始 IM/LV 量表与调查日期，排除 Recommend Suppress=Y 项。不导入就业趋势，不将其当作马来西亚数据 |
| ESCO | 已通过正式公共 REST API `/resource/occupation?uri=…&language=en` 获取 5 职业及 essential / optional 技能关联、ESCO/ISCO 分类 | 欧盟职业分类背景，不是就业需求。门户显示 v1.2.1，但指定该版本的实际请求返回 HTTP 500；默认 API 成功。用响应内容 SHA-256 指纹记录实际版本，不冒称 v1.2.1 |
| MYFutureJobs | **未接通自动数据访问，0 条市场数据**。未在核查的官方渠道确认可复用公共 API；独立人工导入适配器已实现，等待许可审核与数据 | 马来西亚。官网可浏览并不意味着可复制发布；现阶段只提供官方参考链接。不抓取招聘列表、不绕过登录、不伪造统计 |

渠道及使用条款（2026-10-22 核查）：

- O*NET 官方下载：https://www.onetcenter.org/database.html 。官方资料使用 USDOL/ETA 的 O*NET Database，CC BY 4.0：https://www.onetcenter.org/license_db.html 。界面提供归属、条款链接和团队增补说明。
- ESCO API：https://esco.ec.europa.eu/en/use-esco/use-esco-services-api ，接口文档：https://ec.europa.eu/esco/api/doc/esco_api_doc.html 。分类数据复用规则：https://esco.ec.europa.eu/en/about-esco/faq?page=1 。按要求显示 “This service uses the ESCO classification of the European Commission.” 软件 EUPL 许可与分类数据复用政策是不同事项。
- MYFutureJobs 官网：https://myfuturejobs.gov.my/ 。官网条款：https://myfuturejobs.gov.my/wp-content/uploads/2024/03/TermsAndConditions.pdf ，第 5.4(c) 条对商业目的复制发布要求 SOCSO 明确书面批准。本项目不推定比赛或未来使用自动获得再发布许可。
- PERKESO 官方 LMX 介绍：https://www.perkeso.gov.my/perkhidmatan-kami/perkhidmatan-lain/labour-market-exchange.html 。能浏览 LMX 不能证明有开放 API 或数据再发布许可。

## 结构和事实边界

`data/knowledge/current.json` 是已验证的统一快照；`versions/` 保留已发布版本，`state.json` 是每来源状态及调度账本，`catalog.json` 是五职业的人工审阅上下文关联。

`Occupation` 保存来源、原始 ID / 名称、分类及分类 ID、地区、原文语言、职业描述、技能、能力、任务、教育、趋势、官方 URL、发布日期、日期缺失说明、核验时间、来源版本、许可及许可链接。事实项保留量表、关系、日期及出处。当前两个官方渠道未返回可靠的精确发布日，因此 `published_at` 为 null；没有用下载日期或门户日期代替。O*NET 每行调查日期另外保留。

SOC 与 ESCO 的关联是 **Team Nexus 为这五项示例职业维护的相关背景链接，不是官方等价映射**。ESCO 关系不自动覆盖 SOC 要求。新增职业需人工维护本地化标题、实践模块及明确的评分目标。

`prototype/local/careers.json` 中的既有团队编辑评分目标和本地化项目内容继续保留。官方重要程度与自评等级虽然可能都是 1–5，也不是同一个量表，不自动相除或替换目标。官方数据更新可改变英文职业说明、任务和来源面板；只有审核过的规则修改才改变匹配模型。中文、马来文编辑摘要独立维护；新增官方原文保留英文并标注，不伪装成官方中文／马来文翻译。

报告区分官方事实、规则计算和假设情景。每份报告固定所用知识快照；切语言、What If 都复用该版本，后台更新只影响之后的新测评。

## 同步和回退

```sh
.venv312/bin/python -m src.career.knowledge.sync
# 仅在需要人工提前核查或导入时：
.venv312/bin/python -m src.career.knowledge.sync --force
```

1. POSIX 非阻塞文件锁防同机并发；GitHub 全局 concurrency 防多个调度互相覆盖。
2. 账本的 `last_attempt + 14 days` 判断是否到期。跨月、跨年、闰年均按 UTC 时间计算，不使用错误的 `*/14` 日期 cron。
3. 下载渠道支持 ETag / Last-Modified 时使用条件 GET；没有增量能力时读取完整小型官方表或这五项 ESCO 资源，并比较内容哈希。不会声称数据提供方支持不存在的增量接口。
4. 每个来源完整解析、校验字段、非空核心数据、ID 覆盖、重复 ID、地区和来源链接，再整体替换该来源。失败的来源保留旧记录及其原核验时间。没有旧记录的未接入来源保持空并记录原因。
5. 合成快照再次校验，先归档版本再原子替换 current。全部来源失败时 current **字节不变**；状态账本仍记录失败原因。其他来源成功时可以发布包含旧来源记录的有效组合，旧记录不会被标成刚刚核验成功。
6. `state.json` 记录 `checked_at`、`last_success`、`content_changed`、记录数、错误、下次到期时间。`manual_import_required` 不冒充错误已修复；自动来源失败使 CI 告警。
7. 发布失败后默认下一个 14 天周期重试，维护者可检查错误并使用 workflow_dispatch `force=true` 提前重试。GitHub 调度可能延迟，设计是到期后的每日检查，并非精确到秒的 SLA。

归档不可用时不应手动编辑 current。需要回退时由维护者审阅 `versions/` 中的已知有效文件并恢复 current；运行端自动拒绝比当前更旧的远程快照，正式回退需部署该已审阅快照或明确调整发布元数据。原始 HTTP 缓存是可丢弃的 `.cache/knowledge/http/`，不包含用户回答、不提交仓库。

## 持久化调度：已配置，尚未上线启用

`.github/workflows/career-data-sync.yml` 每日 04:23 UTC（马来西亚 12:23）检查到期；状态和版本写入独立 `career-data` 分支，绝不写 main，不强推。Actions 缓存保存可丢弃下载副本，**真正的持久状态是该分支的版本文件和 state.json**。因此 Replit Autoscale 冷启动或重新部署不会重置 14 天计时。

**本次未推送、未合并 main、未改 Replit 生产部署、未实际开启远程调度。** GitHub 的 schedule 仅运行默认分支上的 workflow；本地 YAML 和时钟测试通过不代表云端已启用。

启用步骤：

1. 团队审核后将本分支代码（包含上一个 local-first 测评提交）通过 PR 合并进默认分支。
2. 在 GitHub Settings → Actions 确认允许此工作流及 `contents: write`；若仓库规则限制机器人创建／更新 `career-data`，为该数据分支配置合适权限，不要取消 main 保护。
3. Actions 中运行一次 `Career knowledge · 14 day sync`，必要时 `force=true`。首次运行创建 career-data 分支，之后仅更新数据及账本。查看 job 成功状态、source-status artifact 和分支 state.json，确认非本地测试。
4. 将本次应用代码发布到**现有** Replit 项目后，后台 `/api/knowledge/current` 会每五分钟最多尝试读取一次该公开仓库 career-data 的已验证快照；3 秒请求超时／网络失败／格式错误时使用当前内存快照或随应用附带的已验证资料。新代码部署前，旧网站不会自动获得此能力。
5. 网页启动时仅后台 GET 一次知识快照，最多等待四秒且不阻止填写；基础报告已有本地 JSON，提交、报告、切语言、What If 都不请求生成式 AI。当前标签页需刷新才载入后续发布版本；已生成报告始终固定版本。

本次本地账本的下次到期为 **2026-11-05 03:45:23 UTC**；这是本地计算结果，尚非已注册的云任务。运行时默认 URL 针对当前公开仓库；仓库转私有或改名时不会向前端加入 GitHub 密钥，而应配置受控服务端分发。数据分支不可达时继续使用随应用附带快照。

MYFutureJobs 导入契约见 `data/knowledge/imports/README.md`。取得合法再发布许可后才将正式导入文件放入 career-data 分支；不要提交私密授权信件、候选人信息、账户或凭证。

## 验收证据与限制

- 已真实完成两次官方通道同步：首轮职业与核心技能，第二轮补齐 transferable skills。当前是 10 条来源独立职业记录，关联既有 5 类职业。首次较早快照也已保留。
- Python / JavaScript 测试覆盖解析量表及技能关系、14 天时钟边界、并发锁、按来源失败保留、全失败 current 不变、损坏远程快照回退、304 条件请求、数据变化更新报告、中英马渲染、What If 同规则即时计算和零生成式请求。
- 浏览器在显式清空 RunPod 环境变量的独立本地服务上，从虚构资料填写四步问卷、提交并显示报告；What If 分析能力调至 5 后出现 88→91、87→91、68→74 的规则变化。来源面板显示两个地区、原文、缺失发布日期、核验时间及官方链接。
- 未执行实际 GitHub cron、机器人写入、Replit 发布或生产验收。本次没有 RunPod 推理费用。
- 当前资料覆盖仅五职业。MYFutureJobs 数据接入、官方准确发布日期、ESCO API 的精确发布版本、中文／马来文官方原文翻译仍未获得，均如实标记；没有马来西亚实时招聘趋势。

## 文件范围

- 新增 `.github/workflows/career-data-sync.yml`。
- 新增 `src/career/knowledge/{__init__,schema,adapters,sync,runtime}.py`。
- 新增 `data/knowledge/catalog.json`、`current.json`、`state.json`、两份 `versions/*.json`、`imports/README.md`。
- 修改 `src/career/api.py`：仅添加只读资料分发及实例状态初始化；原有 AI 接口不改。
- 修改 `prototype/app.js`、`local/engine.js`、`local/ui.js`、`styles.css`、`translations.json`：加载快照、固定报告版本、展示出处和补充两项缺失市场信号翻译。
- 新增 `tests/test_knowledge.py`、`prototype/knowledge.test.mjs`、本说明和 `docs/evidence/knowledge-sources-local.png`；更新 README 和 gitignore。
- 保留任务开始前未提交的 `docs/INTEGRATION_REPORT.md` 及两份 integration 部署证据，不纳入本次提交。未修改 `.env`、RunPod Endpoint、`.replit`、官方提交目录或现有分支。
