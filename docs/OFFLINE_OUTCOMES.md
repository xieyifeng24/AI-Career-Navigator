# Offline questionnaire: complete output catalog

Rule version: offline-1.0.0.

This document enumerates every prewritten output component. Final reports combine these components deterministically; they are not forecasts, a validated aptitude test, or real-time AI inference.

The finite questionnaire supports 41,562,794,700,000 input configurations. This is not a count of distinct careers or guaranteed futures. We test option/branch coverage and bounded combinations, not all configurations.

## Questionnaire / 单选与多选

| Field | Type | Options |
| --- | --- | --- |
| 性别（可不透露） / Gender (optional) | Single / 单选 | 男 / 女 / 不透露 |
| 年龄段 / Age group | Single / 单选 | 0–11 岁 / 12–17 岁 / 18–23 岁 / 24–39 岁 / 40 岁及以上 |
| 学历阶段 / Education level | Single / 单选 | 小学 / 初中 / 高中 / 大学／本科 / 硕士研究生 / 博士 |
| 学业状态 / Study status | Single / 单选 | 在读 / 已毕业 |
| 大学专业方向 / University subject area | Single / 单选 | 计算机／软件／人工智能 / 数学／自然科学 / 工程／能源 / 商科／经济／金融 / 语言／人文／传播 / 法律／社会科学 / 健康／医学 / 教育 / 艺术／设计 / 环境／地理 / 农业／食品 / 其他／尚未确定 |
| 高中文理方向 / School subject stream | Single / 单选 | 文科 / 理科 / 未分科／综合课程 |
| 社交倾向 / Social energy | Single / 单选 | 偏内向 / 偏外向 |
| 行动风格 / Planning style | Single / 单选 | 喜欢做计划 / 喜欢随机应变 |
| 决策倾向 / Decision style | Single / 单选 | 偏理性 / 偏感性与共情 |
| 爱好（可多选） / Interests | Multi-select / 多选 | 艺术类 / 体育类 / 科技类 / 商业类 / 学习类 / 生活类 / 娱乐类 |
| 你用 AI 做什么？（可多选） / How do you use AI? | Multi-select / 多选 | 辅助完成作业 / 总结课程 / Vibe coding／编程 / 艺术创作 / 尚未使用 AI |
| 使用 AI 多久了？ / How long have you used AI? | Single / 单选 | 不足 1 个月 / 1 至不足 6 个月 / 6 至不足 12 个月 / 1 年及以上 |
| 对 AI 的依赖程度 / How much do you rely on AI? | Single / 单选 | 轻度 / 中度 / 重度 |
| 自评学习能力（不是固定标签） / How does learning feel right now? | Single / 单选 | 弱：需要更多指导 / 普通：循序渐进 / 强：愿意自主挑战 |
| 每周可持续投入的学习时间 / Sustainable learning time each week | Single / 单选 | 不足 10 小时 / 10 至不足 20 小时 / 20 至不足 30 小时 / 30 至不足 40 小时 / 40 小时及以上 |
| 偏好的学习方式（可多选） / Preferred learning methods | Multi-select / 多选 | 做题与练习 / 听讲与讲解 / 自我探索 |
| 思维偏好（可多选，不代表天赋） / Ways of thinking you enjoy | Multi-select / 多选 | 文科思维 / 理科思维 / 艺术思维 |
| 国籍 / Nationality | Optional dropdown | 249 region codes + undisclosed; excluded from scoring |

University majors are conditional on bachelor/master/doctorate; school stream is conditional on upper secondary. AI duration and reliance are hidden for non-users. Hidden values never enter the result. Age/month/hour ranges have explicit non-overlapping boundaries.

## Rules

- Career points: 4 per matching interest, 6 for university major, 2 for school stream, 2 per mindset, 1 per AI purpose. Ties follow catalog order.
- Gender, nationality, age, personality and self-rated ability do not change career points. Age and education affect the learning pathway; personality affects learning habits; support needs affect starting workload.
- SDG points: 2 per matching interest, 3 per linked career among the top three. Ties follow numeric goal ID. These are editorial associations, not measured impact.
- I/E = inward/outward energy; J/P = planned/flexible; R/F = reasoning/empathy. Eight possible three-letter shorthands are independent of the 17 goal companions. This is not MBTI or psychological measurement.
- Weekly starting hours: 3,6,8,10,12 for the five time bands. Support needs multiply this by 0.75 and round down, at least 1. Children are capped at 2; teens at 4. Users may reduce this commitment.
- The four-week plan uses baseline, prototype, verification and reflection. Foundation/project/review hours sum exactly to the suggested weekly total.
- No model, random number, date, API, live market statistic or language changes the ranking. Multi-select click order is normalised.

## 24 career directions / 全部职业方向

### 1. 软件开发工程师 / Software developer

ID: software. SDG: 9, 8, 4.

- 技能：编程基础、软件测试、版本控制
- 进入路径：先掌握一种语言并积累小作品，再核实具体岗位要求。
- 试做项目：制作可新增、编辑和删除记录的本地学习跟踪器，验证五种边界情况。
- AI 辅助：用 AI 解释报错或起草测试，自己运行代码验证。
- 人需负责：自主确定需求、隐私与正确性，不交付无法解释的代码。

### 2. 数据分析师 / Data analyst

ID: data. SDG: 8, 9, 12.

- 技能：电子表格、统计基础、数据表达
- 进入路径：用作品体现表格、SQL 和统计能力，证书本身不能代替实践。
- 试做项目：分析一份虚构月度预算，手动核对总额并解释三种支出规律。
- AI 辅助：让 AI 提供公式与图表草稿，再与已知结果对照。
- 人需负责：展示结论前核查样本、缺失值和因果表述。

### 3. AI／机器学习工程师 / AI / machine-learning engineer

ID: ai-research. SDG: 9, 4, 8.

- 技能：线性代数、机器学习、模型评估
- 进入路径：建立数学、编程和实验设计基础；研究岗位可能需要研究生训练。
- 试做项目：在公开练习数据上比较简单分类器与多数类基线，记录错误。
- AI 辅助：用 AI 理解方法和设计实验，并自行复现结果。
- 人需负责：控制数据泄漏、偏差和过度结论，使用 AI 多不等于能力强。

### 4. 网络安全分析师 / Cybersecurity analyst

ID: security. SDG: 9, 16.

- 技能：网络基础、威胁建模、事件记录
- 进入路径：先学习网络、操作系统与授权实验环境，再准备安全岗位。
- 试做项目：为虚构校园网站建立威胁模型并提出五项防护措施，不攻击真实系统。
- AI 辅助：用 AI 总结虚构日志或解释防护概念。
- 人需负责：核实告警、保护秘密，并严格在授权范围内操作。

### 5. 用户体验／无障碍设计师 / UX / accessibility designer

ID: ux. SDG: 10, 9, 11.

- 技能：用户研究、原型设计、无障碍设计
- 进入路径：用案例展示从研究到设计的过程，并掌握基础无障碍知识。
- 试做项目：重新设计虚构大学表单，检查键盘操作、对比度与标签。
- AI 辅助：用 AI 起草界面文案和布局备选，不编造用户访谈。
- 人需负责：在获得同意后收集反馈并测试可用性，不假设所有用户相同。

### 6. 数字艺术／视觉传播设计师 / Digital artist / visual communicator

ID: creative. SDG: 4, 12.

- 技能：视觉构图、原创叙事、版权意识
- 进入路径：建立包含过程说明的原创作品集，兼顾软件技能与创作能力。
- 试做项目：制作三张倡导修复旧物的原创海报，说明视觉选择与素材来源。
- AI 辅助：用 AI 探索氛围和草稿，保留创作判断并说明 AI 使用。
- 人需负责：核查版权、刻板印象和事实信息，生成图像不等于自动获得所有授权。

### 7. 游戏／交互体验设计师 / Game / interactive-experience designer

ID: game. SDG: 4, 9.

- 技能：游戏系统设计、交互设计、试玩测试
- 进入路径：先完成可玩原型和测试记录，再选择设计或工程方向。
- 试做项目：制作五分钟回收主题小游戏，观察一位自愿试玩者并修改一条不清晰规则。
- AI 辅助：用 AI 构思机制或解释原型代码，实际测试游玩体验。
- 人需负责：设计公平进度与可访问交互，避免诱导消费循环。

### 8. 产品／项目协调员 / Product / project coordinator

ID: product. SDG: 8, 9, 17.

- 技能：优先级管理、需求分析、相关方沟通
- 进入路径：通过小团队项目展示交付与沟通能力，具体要求因组织而异。
- 试做项目：规划虚构校园应用，明确三项用户需求、里程碑和验收清单。
- AI 辅助：用 AI 整理需求与会议记录，并向负责人核实决策。
- 人需负责：负责取舍、同意与范围控制；流畅的 AI 文案不能证明真实需求。

### 9. 营销／传播策划 / Marketing / communication strategist

ID: marketing. SDG: 8, 12.

- 技能：受众研究、活动策划、效果衡量
- 进入路径：积累受众研究、清晰写作与可衡量营销实验的证据。
- 试做项目：设计虚构修复宣传活动，制作两版信息并制定理解度测试计划。
- AI 辅助：用 AI 起草不同文案，核查事实、语气与可访问性。
- 人需负责：避免误导宣传与无依据的环保承诺，实际衡量效果而非编造结果。

### 10. 业务／运营分析师 / Business / operations analyst

ID: business-analysis. SDG: 8, 9, 12.

- 技能：流程梳理、表格建模、问题定义
- 进入路径：展示范围清晰、基线明确并包含验证方法的流程案例。
- 试做项目：梳理虚构图书馆需求流程，用样例数据衡量延迟并提出一项改进。
- AI 辅助：用 AI 整理假设和流程图草稿，逐项核实计算。
- 人需负责：核查谁获益、谁承担成本，以及改进方案是否可检验。

### 11. 财务／影响力数据分析师 / Financial / impact-data analyst

ID: finance. SDG: 8, 1, 12.

- 技能：会计基础、财务建模、假设检验
- 进入路径：发展会计与表格能力；受监管金融岗位可能要求当地资质。
- 试做项目：制作虚构社区项目预算并比较三种成本情景，不涉及投资建议。
- AI 辅助：用 AI 解释公式和起草报告，独立计算总额。
- 人需负责：核实数字、披露假设，不把预测当作收益保证。

### 12. 教育工作者／学习设计师 / Educator / learning designer

ID: education. SDG: 4, 10.

- 技能：课程设计、学习评价、清晰讲解
- 进入路径：正式教学岗位可能需要认可资质；可从指导下辅导或学习作品集开始。
- 试做项目：用一页课程和五道练习讲解一个概念，逐题验证答案。
- AI 辅助：用 AI 提供例子和题目变式，核实正确性与年龄适宜性。
- 人需负责：关注学习者理解与公平，不用自动标签代替反馈。

### 13. 技术写作者／知识编辑 / Technical writer / knowledge editor

ID: writing. SDG: 4, 9, 16.

- 技能：来源核查、信息结构、技术解释
- 进入路径：结合专业知识与目标语言写作作品，并验证文档可用性。
- 试做项目：为小型开源工具编写入门指南，在干净样例中逐步测试。
- AI 辅助：用 AI 构建提纲和简化表述，同时保留来源。
- 人需负责：核查事实、可执行步骤与署名，听起来合理不等于有依据。

### 14. 健康信息／身心健康项目专员 / Health-informatics / wellbeing project specialist

ID: health. SDG: 3, 10.

- 技能：健康数据素养、隐私保护、证据评估
- 进入路径：临床执业需要独立专业许可；本方向从数据与项目工作入手。
- 试做项目：制作虚构运动日志看板，明确教育用途，不作医疗结论。
- AI 辅助：用 AI 整理非敏感笔记和解释字段，不用于诊断症状。
- 人需负责：保护健康隐私，临床内容须由合格专业人员复核。

### 15. 环境／可持续发展分析师 / Environmental / sustainability analyst

ID: environment. SDG: 13, 12, 15.

- 技能：环境科学、数据解读、影响边界
- 进入路径：建立环境与定量基础，专业实地工作可能需要正式训练。
- 试做项目：比较虚构校园垃圾情景，记录假设、单位与测量限制。
- AI 辅助：用 AI 整理证据和提出检查点，核实数字与科学表述。
- 人需负责：避免漂绿，区分拟议改进与已测量环境影响。

### 16. 可再生能源工程师 / Renewable-energy engineer

ID: energy. SDG: 7, 9, 13.

- 技能：物理与电路、能源建模、安全分析
- 进入路径：学习工程基础；专业签署可能需要认可学历与注册。
- 试做项目：建模虚构建筑每日用电量，在纸面上比较小型太阳能情景。
- AI 辅助：用 AI 解释计算与探索方案，核实单位和假设。
- 人需负责：工程安全与合规须由专业人员复核，不自行试装电气设施。

### 17. 城市／社区规划师 / Urban / community planner

ID: urban. SDG: 11, 10, 13.

- 技能：空间思维、社区研究、地图表达
- 进入路径：建立空间作品集，规划设计执业可能受当地资质要求约束。
- 试做项目：绘制更安全的虚构校园步行路线，检查照明、可达性与过街假设。
- AI 辅助：用 AI 探索布局和整理笔记，决策仍应基于观察。
- 人需负责：考虑无障碍与社区同意，美观地图不等于安全证明。

### 18. 食品／农业技术专员 / Food / agricultural technology specialist

ID: agri. SDG: 2, 12, 15.

- 技能：食品系统、测量记录、流程改进
- 进入路径：学习食品或农业科学，专业加工岗位可能需要相关资质。
- 试做项目：记录七天虚构食堂浪费数据，设计基于测量的小型减量试验。
- AI 辅助：用 AI 整理观察和提出数据检查，独立核实食品安全表述。
- 人需负责：保护食品安全，区分模拟结果与实测农业成果。

### 19. 水资源／环境卫生技术专员 / Water-resources / sanitation specialist

ID: water. SDG: 6, 11, 13.

- 技能：水系统基础、采样知识、工程计算
- 进入路径：建立科学与工程基础，实验室和公共卫生工作需相关训练。
- 试做项目：纸面审计虚构建筑用水，提出漏水排查清单。
- AI 辅助：用 AI 整理计算和检查笔记，核对单位与权威指南。
- 人需负责：不能凭聊天机器人或居家观察判断饮用水安全，检测须遵循专业程序。

### 20. 海洋保护分析员 / Marine-conservation analyst

ID: marine. SDG: 14, 13.

- 技能：海洋生态、实地数据质量、地图分析
- 进入路径：学习生态与统计，实地研究可能需要监督、许可和安全训练。
- 试做项目：分类虚构海岸垃圾观察数据，说明采样限制，不干扰野生动物。
- AI 辅助：用 AI 整理类别和图表草稿，核实物种与地理信息。
- 人需负责：遵守保护规范，区分观察与推断的生态变化。

### 21. 生物多样性／自然保护研究员 / Biodiversity / conservation researcher

ID: biodiversity. SDG: 15, 13.

- 技能：生态学、观察规范、数据记录
- 进入路径：建立生物与研究技能，高阶保护研究通常需要相关训练。
- 试做项目：设计非侵扰式虚构校园物种调查，将实际观察与猜测分开记录。
- AI 辅助：用 AI 起草记录模板，结合可靠指南核实鉴定。
- 人需负责：不干扰生物、不泄露敏感栖息地，不能确定的鉴定应保留不确定性。

### 22. 社区／社会影响项目协调员 / Community / social-impact coordinator

ID: social-impact. SDG: 1, 10, 5.

- 技能：社区倾听、项目设计、结果评估
- 进入路径：从指导下志愿服务和评估入手，社会工作执业可能需要注册。
- 试做项目：设计虚构教材共享项目，明确使用规则、同意机制与简单成果指标。
- AI 辅助：用 AI 起草宣传备选与后勤计划，不推断谁值得获得帮助。
- 人需负责：让受影响的人参与决策，保护尊严、同意与可及性。

### 23. 政策／法律研究分析员 / Policy / legal-research analyst

ID: policy. SDG: 16, 5, 10.

- 技能：证据综合、论证分析、严谨引用
- 进入路径：积累研究写作证据；法律执业须符合具体司法辖区资质要求。
- 试做项目：比较两份公开校园政策提案，在简报中区分事实、价值与假设。
- AI 辅助：用 AI 整理论点，对照原文核实每一条引用。
- 人需负责：标明不确定性与利益冲突，生成简报不能代替法律意见。

### 24. 国际／社区合作协调员 / International / community partnerships coordinator

ID: partnerships. SDG: 17, 8, 4.

- 技能：跨文化沟通、项目协调、共同衡量
- 进入路径：展示语言、协调与跟进能力，国际岗位的进入路径多样。
- 试做项目：设计虚构双社团合作，明确共同目标、职责与复盘会议。
- AI 辅助：用 AI 起草翻译和议程，由人核实含义与承诺。
- 人需负责：建立信任、确认同意，确保每个伙伴都能质询计划。

## 17 SDG companions / 原创角色

Official goal titles: https://sdgs.un.org/goals (checked 22 October 2026). Character art, names, mappings and rules are original product interpretations, not official UN mascots, endorsement or measured SDG contributions.

### SDG 1: 无贫穷 — CARE / 社区守望者

让基本资源更容易被需要的人获得。

整理校园免费支持资源，不收集收入或身份信息，并核实每个链接可用。

Official source: https://sdgs.un.org/goals/goal1

### SDG 2: 零饥饿 — SEED / 丰收守护者

将对食物的珍惜转化为可行系统。

记录一周虚构食物浪费数据，提出一项可衡量的减剩方案。

Official source: https://sdgs.un.org/goals/goal2

### SDG 3: 良好健康与福祉 — VITA / 健康同行者

通过日常习惯支持身心健康。

设计可退出的学习休息提醒，评估可用性，不声称医疗效果。

Official source: https://sdgs.un.org/goals/goal3

### SDG 4: 优质教育 — LUMA / 学习点灯人

让难懂的想法变得可理解。

为自己理解的概念制作一页讲义和五道核验过的练习。

Official source: https://sdgs.un.org/goals/goal4

### SDG 5: 性别平等 — EQLY / 平等倡议者

看见阻碍，让机会更公平地被分享。

检查虚构社团招募海报中的刻板印象，改写为包容性文案。

Official source: https://sdgs.un.org/goals/goal5

### SDG 6: 清洁饮水和卫生设施 — AQUA / 清流工程师

用细致观察珍惜水资源。

建立虚构用水清单并计算一种节水情景，不作饮水安全判断。

Official source: https://sdgs.un.org/goals/goal6

### SDG 7: 经济适用的清洁能源 — SOLA / 逐光发明家

寻找高效能源，支持有用的想法。

用明确单位比较虚构设备能耗，提出安全的习惯调整。

Official source: https://sdgs.un.org/goals/goal7

### SDG 8: 体面工作和经济增长 — GROW / 机会开拓者

把实用技能与负责任的工作连接起来。

梳理虚构工作流程，测试一项改进，同时保留合理工作量和人工复核。

Official source: https://sdgs.un.org/goals/goal8

### SDG 9: 产业、创新和基础设施 — NOVA / 创新构筑师

构建并测试解决具体问题的工具。

制作离线校园工具原型，记录三项测试，包含失败情景。

Official source: https://sdgs.un.org/goals/goal9

### SDG 10: 减少不平等 — LINK / 共融搭桥人

寻找让更多人能够参与的设计。

检查样例表单的键盘访问、对比度和通俗语言，记录三项改进。

Official source: https://sdgs.un.org/goals/goal10

### SDG 11: 可持续城市和社区 — URBN / 社区造梦师

让共享空间更友好、更实用。

绘制虚构校园步行角落，说明通行、遮阴和垃圾桶布局。

Official source: https://sdgs.un.org/goals/goal11

### SDG 12: 负责任消费和生产 — LOOP / 循环修造家

让材料与物品拥有新的使用篇章。

为一件日常物品制作修复或再利用指南，说明材料判断的局限。

Official source: https://sdgs.un.org/goals/goal12

### SDG 13: 气候行动 — CLIM / 气候领航员

把气候关切变成谨慎的小实验。

比较两种虚构出行情景，列明数据来源，不声称未经测量的减排。

Official source: https://sdgs.un.org/goals/goal13

### SDG 14: 水下生物 — TIDE / 蔚蓝探索者

在尊重海洋生态的前提下探索蔚蓝。

分类虚构海滩垃圾记录，提出不干扰生态的观察规范。

Official source: https://sdgs.un.org/goals/goal14

### SDG 15: 陆地生物 — ROOT / 森林守护者

通过留意生命细节关心栖息地。

设计虚构植物观察日志，清楚标注尚未确定的鉴定。

Official source: https://sdgs.un.org/goals/goal15

### SDG 16: 和平、正义与强大机构 — JUST / 公正调解者

让规则更清晰，让决定能够被质询。

起草虚构社团决策规则，明确理由、申诉路径和隐私边界。

Official source: https://sdgs.un.org/goals/goal16

### SDG 17: 促进目标实现的伙伴关系 — ALLY / 伙伴联结者

围绕共同目标连接不同优势。

规划虚构双社团 SDG 项目，明确共同责任和一项可检验成果。

Official source: https://sdgs.un.org/goals/goal17

## 32 learning and AI modules / 完整建议模块

### 以游戏探索兴趣 / Explore through play (stage-child)

这些是长期可能性。可与可信赖的成年人尝试不同学科和小项目，不需要过早确定职业。

### 保留学科与职业选择 / Keep your options open (stage-teen)

建立阅读、数学与数字素养，积累小作品，并与老师核实选科前提。

### 把在读学习连接到作品 / Connect study to a portfolio (stage-student)

保留专业基础，完成一个小项目，再比较课程选择与有指导的实习要求。

### 先验证方向，再决定转变 / Test a direction before a large move (stage-graduate)

比较真实准入要求、完成相关工作样本并征求反馈，再决定转职或深造。

### 先打基础，再逐步专门化 / Foundations before specialisation (school-foundation)

当前学历阶段影响起步步骤，不决定未来上限。保留通用技能，先做可接近的小项目。

### 增加研究或评估视角 / Add a research or evaluation angle (research-extension)

研究生阶段可把项目连接到文献问题、可复现基线与局限，并请导师审阅范围。

### 先准备，再表达 / Prepare, then share (social-introvert)

先独立工作并写下要点，再征求一项具体反馈。内向不排除需要沟通的职业。

### 先交流，再独立验证 / Discuss, then verify independently (social-extrovert)

向自愿交流的同伴解释想法，再做一次独立检查，避免团队热情代替证据。

### 使用清晰检查清单 / Use a visible checklist (planning-planned)

每次学习前确定下一项成果与停止点，并为意外错误预留时间。

### 从小实验菜单中灵活选择 / Choose from a small experiment menu (planning-spontaneous)

保留三个小任务供每次选择，切换主题前先完成一个微型成果。

### 让假设可以被检查 / Make assumptions inspectable (decision-rational)

写下假设与比较标准，同时检查决策会影响谁。

### 让共情与证据相互补充 / Pair empathy with evidence (decision-empathetic)

先理解人的需要，再核实事实和现实条件，最后选择方案。

### 一次建立一个小进展 / Build one success at a time (ability-support)

先看完整例题，再做可重复的小练习并获得反馈。自评描述当前支持需求，不是固定能力。

### 交替使用示例与练习 / Alternate examples and practice (ability-steady)

学习一个示例，独立解决相似问题并复盘差异，再增加难度。

### 增加可验证挑战 / Add a testable challenge (ability-confident)

选择一项有明确验证标准的拓展任务，保留基线与错误记录；速度本身不等于掌握。

### 练习优先路径 / Practice-first route (style-practice)

先做短练习再看解答，记录错误并重试变式。

### 讲解优先路径 / Explanation-first route (style-lecture)

学习一段短讲解，关闭资料后用自己的话复述，再完成练习。

### 探索优先路径 / Exploration-first route (style-explore)

选一个小问题，先预测，再做有边界的实验并比较结果。

### 偏好不等于固定脑型 / A preference, not a brain type (mindset-note)

语言、分析和视觉方法可以组合与训练。这些选择只是切入口，不是生物学分类。

### 可从 AI 素养开始 / Start with AI literacy, if you want (ai-none)

完成本计划不需要使用 AI。先了解生成工具的常见错误，确有帮助时再尝试微型虚构示例。

### 将 AI 作为可选助手 / AI as an optional assistant (ai-light)

保留人工基线，只让 AI 提供有边界的备选，并自行核实事实、来源与计算。

### 建立可重复复核流程 / Build a repeatable review routine (ai-moderate)

将起草与检查分开，对每份 AI 辅助输出记录接受、拒绝及独立验证的部分。

### 加强独立掌控能力 / Strengthen independent control (ai-heavy)

先独立尝试一个短任务，识别需要帮助的环节，再使用提示而非整份答案。重度依赖不是诊断，也不能证明能力低。

### 第一个月的习惯 / First-month habit (duration-under1)

先了解工具边界，用可靠参考核实简单输出，再扩大任务范围。

### 早期流程习惯 / Early workflow habit (duration-1to6)

建立 AI 输出检查清单，并保留发现错误的例子。

### 比较不同方法 / Compare alternatives (duration-6to12)

用同一评价标准比较 AI 辅助与人工流程。

### 复核长期使用习惯 / Audit established habits (duration-over12)

复核熟悉的 AI 流程，检查过时假设、隐藏错误和仍需独立练习的技能。

### 作业：先提示，后核对 / Homework: hints before answers (purpose-homework)

先独立尝试并遵守课程规则，用 AI 解释某一步，只提交自己理解且获准使用的内容。

### 课程总结：回到原文核实 / Summaries: verify the original (purpose-summary)

对照课件检查摘要，补回遗漏的限定条件，然后尝试凭记忆提取重点。

### Vibe coding：解释并测试 / Vibe coding: explain and test (purpose-coding)

读懂每处修改，测试边界并保护密钥；不能追踪代码时，先让 AI 解释。

### 艺术创作：保留创作判断 / Creative work: direct the result (purpose-creative)

保留原创选择，检查授权与呈现方式，并在适当场景说明 AI 辅助。

### 核实地区相关路径 / Check location-specific pathways (cross-border)

国籍不参与排序。入学、语言、职业注册和工作许可要求取决于目的地，需要另行核实。

## Verification

39 Node tests passed, including all 22 previous tests. New tests cover every scalar option, all non-empty interest/style/mindset subsets, all AI-purpose subsets and non-use, duration/reliance combinations, every advice branch, 24 selectable plans, 17 avatar cells, multilingual rendering and a no-network import graph.
Browser QA: Chinese intake completed, conditional stream/major fields checked, none exclusivity checked, instant local report created, report translated to Malay/English with answers and career order retained, SDG gallery checked, desktop width 1440 checked without horizontal overflow. Additional QA notes are in OFFLINE_IMPLEMENTATION.md.
No commit, push, merge or deployment was performed on this branch.
