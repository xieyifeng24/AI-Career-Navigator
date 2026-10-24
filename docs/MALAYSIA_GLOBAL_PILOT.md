# Malaysia to Global：软件方向试点

本阶段沿用现有 V3 十二题、确定性个人画像、职业探索比较、星图、What If 与 SDG。地区切换只替换职业和市场证据，不改变任何原始答案或探索顺序。`data/regional/current.json` 是随应用发布的已核验快照；`/api/regional/current` 优先读取公开 `career-data` 分支的有效快照，失败保留上一个有效版本。测评过程不请求外部数据源或模型。

## 实际来源与覆盖

| 来源 | 读取方式与状态 | 试点可用内容 | 限制 |
| --- | --- | --- | --- |
| [DOSM/OpenDOSM](https://api.data.gov.my/data-catalogue?id=wages_occupation) | 官方 CSV/API 已实际成功读取；2025 年数据 | 专业人员大类月工资中位数 | MASCO 大类，不能称作软件开发工资；并非所有马来西亚工作者 |
| [DOSM MyJobProfile / MASCO](https://myjobprofile.dosm.gov.my/bda-myjobprofile/job/2512/software-developers) | 官方页面人工审阅导入 | MASCO 2512 软件开发任务 | 页面上的零职位、零薪资显示不作为事实导入 |
| [TalentCorp MyCOL 2024/2025](https://www.talentcorp.com.my/images/uploads/publication/204/MyMahir-Malaysia-Critical-Occupations-List-MyCOL20242025-1773385490.pdf) | 官方 PDF 人工审阅导入 | MASCO 2512 出现在紧缺职业名单 | 年度结构性信号，不是实时空缺数 |
| [O*NET Database](https://www.onetcenter.org/database.html) | 现有官方 CSV 导入，版本 31.0；继续复用 | 软件开发与相关研究职业的任务、技能 | 美国职业资料；O*NET Web Services 2.0 需单独 API Key，本阶段未配置 |
| [BLS Table 1.2](https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm) | 官方表格人工核对导入，2025–2035 版 | SOC 15-1252 软件开发职业的 2025 年工资和美国就业变化预测 | 本运行环境直连 BLS 返回 403，因此不是实时 API；无独立 AI/ML Engineer 行 |
| [ESCO](https://esco.ec.europa.eu/en/use-esco/use-esco-services-api) | 复用现有官方 API 快照 | 欧洲职业与技能关系；软件开发者可做跨区域技能参考 | 非全球就业市场统计；AI 路线只有相关智能系统设计职业，不是等价分类 |
| [World Bank Indicators](https://api.worldbank.org/v2/country/MYS;USA/indicator/SL.UEM.TOTL.ZS?format=json) | 官方 API 已实际成功读取 | 2025 年马来西亚和美国全国失业率，统一指标 | 全行业宏观背景，不能当软件或 AI 工程岗位需求 |
| [ILOSTAT SDMX](https://www.ilo.org/resource/other/ilostat-sdmx-user-guide) | 尚未直接接入 | 无 | World Bank 指标标注其 modeled ILO estimate 来源，不能称为直接 ILOSTAT API |

映射记录保存在 `data/regional/current.json`，分别记录内部职业 ID、MASCO、O*NET-SOC、ESCO URI、地区、关联类型和审查状态。`software`：MASCO 2512、O*NET-SOC 15-1252.00、ESCO software developer 是经审阅的**语境对应**，三套分类的范围不完全相同。`ai-research`：没有核验到独立的 AI/ML Engineer 跨体系代码；O*NET 15-1221.00 和 ESCO ICT intelligent systems designer 仅作为相关职业背景。不能把其薪资或预测移植到 AI/ML Engineer。

## 更新与运行

现有 `career-data-sync.yml` 每日检查一次持久账本，到期才执行；区域任务以 14 天为检查间隔。DOSM 与 World Bank 成功时写入来源统计期和核验时间；失败时保留上一份有效快照。O*NET/ESCO 由现有知识库任务更新；MyCOL、MASCO 与 BLS 需要人在官方发布新版本时重新审阅，14 天检查不代表官方数据实时更新。自动任务只写 `career-data` 数据分支，正式应用每五分钟最多核查一次公开的有效快照。首次启用该工作流和实际服务器部署状态须分别验证。

本地手动检查：`python -m src.career.regional`；仅经审阅的官方事实写入版本文件。数据源无法访问时维持已有版本。模型密钥仅从后端 `RUNPOD_API_KEY`、`RUNPOD_ENDPOINT_ID` 读取。可选 AI 接口 `/api/regional/explain` 在用户主动确认并点击后才接受 12 道 V3 数字答案、简短确定性画像与服务端事实；不发送自由文本补充、姓名或联系方式。它复用现有匿名会话、CSRF、同源检查、SQLite 调用配额和单并发保护，并设置超时及半小时按会话缓存。失败只影响附加解释，基础报告不受影响；模型输出不回写分数或外部事实。

## 虚构用户 A 的地区报告示例

此人为虚构用户，完整 12 题原始答案、个人画像、两条路径、任务证据及行动方案见 [SW_SAMPLE_REPORT_A.md](SW_SAMPLE_REPORT_A.md)。软件开发先于 AI/ML 路线属于可追溯的探索顺序，不是已验证胜任力。

**马来西亚**：MASCO 2512 将需求分析、设计、开发、测试和维护列为软件开发任务。MyCOL 2024/2025 将该职业列入紧缺职业名单。DOSM 2025 年 *所有专业人员* 月工资中位数为 RM 6,124；这是大类背景，绝非本职业薪资。AI/ML Engineer 缺少可审阅的独立职业映射，因此不显示其马来西亚专属工资或空缺数据。

**美国**：O*NET 31.0 的软件开发任务包括需求分析、开发及测试。BLS 2025–2035 表格对 SOC 15-1252 的就业变化预测为 **10.2%**，2025 年美国工资中位数为 **USD 135,980/年**。这些是美国职业统计，不代表该用户成功概率、AI 替代率或马来西亚市场。O*NET 的计算机与信息研究科学家记录是 AI 路线的相关研究背景，不是 ML Engineer 的独立统计。

**国际技能**：ESCO 的 software developer 记录关联 debug software 等技能，可与用户 A 自述的调试兴趣和经历作进一步核验；这仍不证明其实际技能。世界银行 2025 年全国失业率指标为马来西亚 **3.764%**、美国 **4.198%**（以快照值为准，均为全行业 modeled ILO estimate）；不能用这两个数给职业路径排名，也不与 DOSM/BLS 工资口径混合。

**个人下一步**：沿软件路线完成可运行功能、边界测试和一条故障修正记录；沿 AI/ML 路线另做小型分类器与多数类基线、泄漏检查和数学假设说明。这两份作品分别补充测评尚未观察到的证据。AI 辅助解释仅在真实请求成功后单独展示，不属于此离线样张。

任何定量信息均来自快照列明的职业代码、来源、统计期与核验时间。地区切换不重新计算个人画像、职业顺序或 What If 原始场景。

## 本地验收状态（2026-10-24）

- DOSM 官方 CSV/API 与 World Bank Indicators API：真实 HTTP 请求成功，区域快照验证并写入。O*NET 31.0 与 ESCO 职业记录来自上一轮已经核验的官方导入；本轮对 ESCO 公开接口的额外直连遭遇网络网关重定向，因此不声称本轮刷新成功。
- BLS 当前官方表格：在官方可访问页面核对了 SOC 15-1252 行；本运行环境直连返回 403，故标记为人工核对导入。MyCOL、MASCO 同样标记人工核对。ILOSTAT 尚未直接接入；O*NET Web Services 2.0 需要未配置的独立 API Key。
- RunPod：使用既有私密本机凭证，以虚构 V3 答案向现有端点做了一次小型连通请求和一次完整、结构化且通过服务端字段／引用校验的解释请求。首次大请求超时、另一次含不当薪资推断的输出被拒绝，基本报告均保持可用；最终缩短输入后的真实解释成功。此验证只证明本机现有端点可用，不证明 Replit Secrets 或正式网站已经运行本次代码。
- 自动化：本地验证了 14 天账本和来源故障保留旧快照；GitHub Actions 修改尚未在远程运行，生产自动更新不标为已启用。
