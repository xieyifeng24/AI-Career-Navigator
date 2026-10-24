# 软件开发与 AI 工程：虚构用户 A 的完整测评报告示例

**生成方式**：本文件由当前 `main` 的 `buildCompatibleReport` 和真实 V3 题库在本地生成。用户 A 完全虚构；没有调用 AI API。以下是探索性解释，不是已验证能力、招聘概率或科学量表。

## 原始 12 道题与答案

- G01 面对自己还不了解的职业方向，我愿意先通过小项目亲身体验，再决定是否适合继续探索。 **7/7**
- G02 即使某种技能因为技术变化而不再那么重要，我也愿意调整计划、学习新的方法。 **6/7**
- G03 过去一个月，我曾主动用 AI 工具帮助自己完成学习、工作或生活中的具体任务。 **6/7**
- G04 当 AI 给出看似合理的答案时，我会核对其中重要的事实、来源或结果，而不只是相信它的表述。 **6/7**
- SW01 相比只讨论产品创意，我更想亲手把一个想法变成能实际运行的工具。 **7/7**
- SW02 发现一段程序为什么出错，会让我产生想继续追查的兴趣。 **6/7**
- SW03 遇到复杂功能时，我倾向于先拆成几个可以分别测试的小步骤。 **6/7**
- SW04 为了让产品可靠，我愿意反复修改同一个功能，而不急着添加新功能。 **6/7**
- SW05 我亲自制作或修改过能运行的程序、网页、脚本或自动化工具。 **6/7**
- SW06 我曾通过运行结果、报错信息或测试，自己定位并修复一个技术问题。 **5/7**
- SW07 让 AI 生成代码时，我会根据实际需求修改它，而不是直接采用第一版。 **5/7**
- SW08 如果 AI 声称登录功能已经完成，我会检查正常登录、错误密码等情况，再认为它可以使用。 **7/7**

## 综合个人画像

- **interest**：你倾向于制作可运行工具并追查故障，工程作品能验证这项具体兴趣。 （依据 SW01=7、SW02=6；self-report）
- **workstyle**：你自述偏好可测试的拆解与反复修正；带错误记录的项目可以检验能否落实。 （依据 SW03=6、SW04=6；self-report）
- **experience**：你自述制作过可运行作品并修复过技术问题；本次没有观察到作品或过程。 （依据 SW05=6、SW06=5；self-report）
- **ai-practice**：你自述近期使用 AI，并表示愿意修改 AI 生成代码；这是协作方式线索，不证明代码质量或机器学习能力。 （依据 G03=6、SW07=5；self-report）
- **ai-verification**：你描述了核查 AI 结论与测试异常情况的习惯；登录示例是假设情景，仍需真实测试记录。 （依据 G04=6、SW08=7；self-report）
- **exploration**：你倾向于先做可逆实验并调整计划；这是意愿，并非已测量学习速度。 （依据 G01=7、G02=6；self-report）
- **reported-method-combination**：你自述的构建、修复经历与测试迭代兴趣相呼应。仓库及测试日志可核验这些线索是否在实践中一致。 （依据 SW05=6、SW06=5、SW04=6；self-report）

## 职业探索顺序与依据

当前判断：**先验证软件开发，再验证 AI／机器学习路线**。软件任务偏好净线索 4；相关研究路线 1，其中 2 项核心要求未测量。每条来源任务只给一个偏好符号，不把该计数当能力分数。

### 1. 软件开发工程师

你认同 4 项与软件任务相连的偏好；来源任务包括开发、纠错、测试与需求分析。自述经历另行考虑。 依据：SW01=7、SW02=6、SW04=6、SW03=6。

**有来源的任务与问卷关联**（任务原文保留英文；关联是团队推断）：
- Design, develop and modify software systems, using scientific analysis and mathematical models to predict and measure outcomes and consequences of design. [O*NET task 21667](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 develop software prototype [esco:http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1](http://data.europa.eu/esco/skill/797a4416-0b8d-44f3-8fcd-eb10bd0be6b4)；SW01=7/7，偏好状态 endorsed。
- Modify existing software to correct errors, adapt it to new hardware, or upgrade interfaces and improve performance. [O*NET task 21670](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 debug software [esco:http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1](http://data.europa.eu/esco/skill/2522a6ce-3202-4ac8-9f5b-b9cb5a3a83a1)；SW02=6/7，偏好状态 endorsed。
- Develop or direct software system testing or validation procedures, programming, or documentation. [O*NET task 21669](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 Systems Evaluation [onet:15-1252.00](https://www.onetcenter.org/dl_files/database/db_31_0_csv/transferable_skills.csv)；SW04=6/7，偏好状态 endorsed。
- Analyze user needs and software requirements to determine feasibility of design within time and cost constraints. [O*NET task 21662](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 Systems Analysis [onet:15-1252.00](https://www.onetcenter.org/dl_files/database/db_31_0_csv/transferable_skills.csv)；SW03=6/7，偏好状态 endorsed。

**技能与证据缺口**：问卷记录偏好及自述经历，但不测试编程、调试、测试或需求分析能力。 来源技能要求：develop software prototype、debug software、Systems Evaluation、Systems Analysis。这些不是已经证实的个人短板。

**AI 对任务的可能影响**：对于来源中的开发与验证任务，AI 可能起草实现或测试思路。这是团队流程推断，不是官方自动化结论。 **人工责任**：需求判断、可复现测试、错误分析与后果仍由人负责。

**下一项验证任务**：为本地学习跟踪器新增一项用户提出的功能及一条错误处理流程。

**为什么**：可用有来源的软件开发与验证任务核查你自述的构建和修复经历。

**验收标准**：提交可运行仓库、五个正常与边界测试、一处可复现故障和修正提交。

**可新增证据**：为实现、测试和迭代增加直接证据，不生成通用熟练度分数。 依据 SW01、SW02、SW04、SW05、SW06。

### 2. AI／机器学习工程师

1 项相关问题求解偏好得到认同；数学建模与 AI 原理仍未测量。使用 AI 工具不等于机器学习能力。 依据：SW03=6。

**有来源的任务与问卷关联**（任务原文保留英文；关联是团队推断）：
- Analyze problems to develop solutions involving computer hardware and software. [O*NET task 14623](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 Complex Problem Solving [onet:15-1221.00](https://www.onetcenter.org/dl_files/database/db_31_0_csv/transferable_skills.csv)；SW03=6/7，偏好状态 endorsed。
- Conduct logical analyses of business, scientific, engineering, and other technical problems, formulating mathematical models of problems for solution by computers. [O*NET task 14629](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 Mathematics [onet:15-1221.00](https://www.onetcenter.org/dl_files/database/db_31_0_csv/essential_skills.csv)；问卷未测量。
- Apply theoretical expertise and innovation to create or apply new technology, such as adapting principles for applying computers to new uses. [O*NET task 14626](https://www.onetcenter.org/dl_files/database/db_31_0_csv/task_statements.csv)；相关技能 principles of artificial intelligence [esco:http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8](http://data.europa.eu/esco/skill/e465a154-93f7-4973-9ce1-31659fe16dd2)；问卷未测量。

**技能与证据缺口**：数学建模和 AI 原理未测量。关联的研究与智能系统职业记录只是相关背景，不等同于机器学习工程师岗位。 来源技能要求：Complex Problem Solving、Mathematics、principles of artificial intelligence。这些不是已经证实的个人短板。

**AI 对任务的可能影响**：对于相关研究任务，AI 可能帮助构思模型变体或组织实验；是否有帮助仍需验证，不推断替代率。 **人工责任**：数据质量、数学假设、基线对比、泄漏检查与后果仍由人负责。

**下一项验证任务**：用同一数据集制作小型分类器与多数类基线；记录训练／测试划分和一种错误模式。

**为什么**：你自述有软件经历，但研究路线还要求问卷未测量的数学建模与 AI 原理。

**验收标准**：提供可复现代码、基线对比、一项数据泄漏检查，并解释一条数学假设。

**可新增证据**：增加关于模型评估与数学推理的初步可观察证据，不证明已具备机器学习工程师胜任力。 依据 SW05、SW06、SW03。

## 跨路线 AI 协作核验

- 原因：自述 AI 核验习惯需要真实案例才能增加可信度。
- 完成：为所选路线保留一份人工基线与一份 AI 辅助尝试，并记录一条被拒绝或修正的 AI 建议。
- 验收：展示原始输入、AI 输出、独立来源或测试，以及最终修正。
- 可新增证据：这可以验证自述核验流程，但不证明通用 AI 熟练度。 依据 G04、SW08。

## What If 与 SDG 边界

若假设完成并复核上面的实践样本，What If 只改变下一步证据复盘建议，不改原始答案或职业排序。SDG 模块由既有背景兴趣规则生成，与本次 V3 职业比较独立。

## 来源与限制

- [onet:15-1252.00](https://www.onetonline.org/link/summary/15-1252.00) · US · 31.0 · 核验 2026-10-23T18:16:07.134968Z；原始发布日期：来源未提供
- [esco:http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1](https://esco.ec.europa.eu/en/classification/occupation?uri=http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1) · EU · api-default-sha256:e64b208c5ea7b7fe · 核验 2026-10-23T18:16:07.134968Z；原始发布日期：来源未提供
- [onet:15-1221.00](https://www.onetonline.org/link/summary/15-1221.00) · US · 31.0 · 核验 2026-10-23T18:16:07.134968Z；原始发布日期：来源未提供
- [esco:http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8](https://esco.ec.europa.eu/en/classification/occupation?uri=http://data.europa.eu/esco/occupation/35553663-deab-4d9a-bf22-15c1625d28e8) · EU · api-default-sha256:3b92000ff772b0d2 · 核验 2026-10-23T18:16:07.134968Z；原始发布日期：来源未提供

O*NET 是美国职业背景，ESCO 是欧盟分类；第二路线的记录仅为相关职业背景，不是机器学习工程师的精确代码。AI 影响段落是基于任务的团队情景推断，官方记录本身没有提供这里的自动化率、马来西亚招聘预测或个人胜任力验证。
