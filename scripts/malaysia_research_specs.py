"""Reviewed research inputs, not generated occupational facts.

Each task line: skill ID | task | proposed AI assistance | human check.
Task selection and AI suggestions are INFERENCE; cited Malaysian descriptions
support the task family, not observed AI adoption in every employer.
"""
SPECS = {}

def role(id, codes, sources, demand, entry, region, outlook, project, target, gap, tasks, ai_context='Unknown：未核实该职业在马来西亚的实际AI采用率；以下为任务层条件分析。'):
    SPECS[id] = dict(codes=codes, sources=sources.split(';'), demand=demand, entry=entry,
        region=region, outlook=outlook, project=project, target=target, transition_gap=gap,
        tasks=[dict(zip(['skill_id','task','assist','human'],line.strip().split('|'))) for line in tasks.strip().splitlines()],
        ai_context=ai_context)

role('data',['2524'],'S09;EMP-IPSOS;BNM-AI',
 'Ipsos Malaysia的Research / Project Executive接受应届生，包含数据校验、Excel/SPSS和客户分析交付；MyCOL确认Data Analyst/Data Scientist相关需求。市场研究、银行保险与制造数据工作须分别核对，单一招聘样本不能给出全国岗位总量。',
 'Ipsos样本：统计、数学、心理、经济等相关学位；应届生可申请，1–2年经验为优势。先展示可复现分析；高级方向补行业知识、数据治理和沟通。',
 '已核实样本为Malaysia，未确认Ipsos具体州；KL/Selangor、Penang、Johor、Sabah/Sarawak的该职业州级数量Unknown。',
 '本地入门样本与MyCOL支持探索分析岗位，但短缺集中在技术、经验与行业知识的组合。AI可降低清洗和制图成本，也提高指标定义、验证和业务解释要求；薪资与竞争随领域不同，不能用AI投资就业总数推断分析师增长。',
 '用OpenDOSM公开数据制作SQL数据集、数据字典、质量测试与可复现仪表板，解释一个错误指标如何影响业务结论。',
 'business-analysis','需补需求访谈、流程建模和业务验收；会SQL不等于会组织变革。',
 '''sql|抽取并关联分析数据|起草查询|核对连接键、权限与行数
data_quality|校验缺失和逻辑一致性|生成检查脚本|调查异常而非自动删除
statistics|设计抽样及指标|比较统计方案|核查偏差与因果限制
visualisation|制作客户图表|建议图表和说明|保持口径、单位与时间一致
stakeholder_research|解释结果和建议|起草业务摘要|将建议追溯到可复现分析''',
 'BNM报告马来西亚金融机构已使用AI进行客户分析、运营和风险管理；这支持金融数据场景，不能代表所有数据分析师。')

role('security',['2531'],'MY-CYBER;MF-CYBER;MYF-CYBER-PAY;BNM-AI',
 'PERKESO 2026年4月招聘会列出PwC网络安全、风险与监管相关职位，包含经验要求；MyCOL指出银行保险安全技能缺口。Kelana Jaya混合IT支持/安全/行政岗位是另一入门样本，两者不可当作同一职业层级。',
 '混合IT样本要求相关diploma/degree和至少一年经验。先学习网络、Linux、日志与授权测试；MyCOL银行保险中级约3–4年、高级超过8年，重行业系统经验及信息安全资格，不能声称证书保证就业。',
 'Kelana Jaya（Selangor）混合IT岗位已核实；KL招聘会只是活动地点。Penang、Johor及Sabah/Sarawak职业份额Unknown。',
 '官方短缺和当地招聘支持机会，但缺口主要是可承担系统与风险责任的能力。AI可能加快告警摘要，也可能生成误报与攻击内容；初级需证明分诊、证据链和升级能力，不能由短缺推出无经验者必然容易入职。',
 '在自有隔离实验室分析合成安全日志，提交告警分诊、一次误报复核、事件时间线和恢复演练；只测试获授权系统。',
 'software','需补数据结构、产品需求、API和可维护代码；安全工具使用不替代软件交付。',
 '''network_security|设计安全网络与访问控制|比较配置方案|核对威胁模型和最小权限
incident_response|分诊日志和安全告警|聚类和摘要告警|人工确定影响与升级
threat_analysis|分析威胁情报|归纳技术指标|核查来源、时效和误报
forensics|调查事件及数字证据|整理事件时间线|维护证据完整性与授权
security_testing|测试并修复漏洞|起草测试和修复建议|限定测试范围并复测''',
 'BNM金融行业AI应用提供本地背景；未核实这些雇主用生成式AI处理安全告警，具体工作流为推断。')

role('ux',['2543'],'MY-UX;MF-UX',
 'PERKESO历史招聘中Bateriku在Shah Alam招聘Senior UI/UX Designer，要求3–5年；证明本地存在岗位，不能证明毕业生供不应求。MyCOL相关创意组的Graphic Designer提名不自动等于UX短缺。',
 '该资深样本接受相关IT diploma并要求作品与经验；大学生应以访谈、原型、可用性验证的完整过程展示能力，不能只交AI生成页面。',
 'Shah Alam（Selangor）为已核实样本；Penang、Johor、Sabah/Sarawak需求数量与集中程度Unknown。',
 '本地岗位存在，但资深样本暴露了作品与实际经验门槛。原型生产可能更快，真实用户研究、无障碍与设计取舍仍需要人判断；不能把视觉产出数量作为UX能力或需求增长。',
 '为校园或社区服务做双语任务流程，获得受访者同意，保留访谈记录、原型、一次可用性测试与修改理由。',
 'product','需补优先级、产品指标和跨团队交付；研究观察不能直接作为市场规模。',
 '''user_research|研究用户任务和障碍|归纳经授权访谈|回看原始记录与少数意见
prototyping|制作交互原型|生成布局备选|保证真实任务可完成
specification|编写交互规格|起草状态说明|核查错误、权限和边界状态
usability_testing|组织可用性测试|整理问题清单|观察真实用户而非虚拟用户
accessibility|评估可访问性和设计取舍|辅助检查文本对比|人工测试键盘和辅助技术''')

role('creative',['2166','2543'],'MY-CREATIVE;MY-UX;MDEC-CONTENT;EMP-STREAMLINE',
 'MDEC提供本地数字内容公司目录和创意项目资源；Streamline列出概念、3D和技术美术等合同机会。合同与全职需分别评估，目录和资助不是岗位数量。',
 '以针对岗位的作品集、设计基础、数字制作与版权说明入门；高级需能控制风格、生产规格、评审和交付。不同设计方向的学历和工具要求不能统一。',
 'Streamline Malaysia相关列表可核实KL业务样本；其远程/合同条目不保证所有州都可受雇。其他州职业份额Unknown。',
 '马来西亚创意产业有实际制作链与项目资源，但外包、合同和项目周期使收入与需求不稳定。生成式图像降低草图成本，也提高美术指导、品牌一致性、权利审查与可编辑资产交付的重要性。',
 '为本地公益活动制作双语视觉系统、可编辑素材和三种规格，记录授权素材、AI生成部分、修改与用户反馈。',
 'ux','需补用户访谈、信息架构和可用性验证；视觉美观不足以证明任务可用。',
 '''visual_design|研究简报与视觉方向|生成情绪板备选|确认品牌和文化语境
asset_production|制作图形与多媒体资产|辅助草图和修图|核对版权、分辨率和可编辑性
layout|排版双语内容|生成版式草案|人工检查字形、层级和语义
design_review|与客户评审并迭代|归纳反馈|记录取舍与版本
production_handoff|交付制作规格|起草资产清单|检查色彩、导出及授权''')

role('game',['2542','2512'],'MY-GAME;S08;MDEC-CONTENT;EMP-STREAMLINE',
 'Streamline KL列出Junior Game Programmer (Unreal)、Junior QA Tester及QA Intern等入门类型，也有合同关卡设计/美术；MDEC数字游戏支持是产业背景，不是新增岗位预测。',
 '程序分支侧重引擎、编程与调试；设计分支侧重关卡、规则、试玩与文档。作品应可运行并包含测试记录；不能给整个游戏行业指定单一学历或引擎。',
 '已核实KL的游戏雇主与实习样本；其他州及远程跨境资格Unknown。',
 '存在本地初级与实习路径，优势来自能进入实际制作流程。AI可辅助脚本、测试和素材草案；性能、玩法验证、授权与团队协作仍是门槛。项目取消和合同波动是风险，不能把全球游戏增长直接移植到Malaysia。',
 '制作一个可玩小关卡，记录帧率、缺陷、三名试玩者反馈和迭代；说明AI素材许可证与原创贡献。',
 'software','需补非游戏业务需求、数据库/API及部署；共享编程不等于完成转型。',
 '''game_design|定义规则与关卡目标|生成机制备选|用试玩验证乐趣和平衡
game_engine|实现引擎逻辑|起草脚本|核查状态、性能和异常
asset_integration|整合美术声音与交互|辅助素材变体|核查权利、风格和资源预算
testing|复现并记录游戏缺陷|生成边界测试|验证真实运行与回归
playtesting|分析试玩反馈|聚类意见|避免用AI玩家代替真实体验''')

role('product',['2421','2425','2511'],'MY-BA;MY-ADMIN;MY-SYSTEMS;MF-FAIR;EMP-IPSOS;BNM-AI',
 'PERKESO 2025招聘会CARSOME列表含Product Manager；Ipsos项目执行是研究/交付相邻样本而非同名产品岗位。没有核实全国Product Manager统计总量；该产品名称需按业务、协调或ICT任务拆分。',
 '大学生可从Product Intern、Project Coordinator、研究执行搜索；这些是建议检索类型而非保证在招。高级产品工作要能明确需求、指标、优先级、上线风险与协调。',
 '现有招聘会资料未逐项确认工作地点；KL/Selangor、Penang、Johor、Sabah/Sarawak的职业数量Unknown，不能用活动地址定位。',
 '本地产品机会有存在性证据，行业和资深程度决定门槛。AI可快速整理反馈及文档，但不能代替取舍、客户承诺和产品责任；需求发现和可核查实验比单纯会写提示词更可迁移。',
 '为校园服务写需求问题、访谈证据、指标定义、优先级决策和小规模试用报告，注明未验证假设。',
 'business-analysis','需补组织流程和可验收的需求建模；产品方向不能跳过领域约束。',
 '''stakeholder_research|识别用户与业务问题|归纳授权反馈|确认问题来自真实证据
prioritisation|比较需求和约束|整理决策备选|负责人确定取舍
specification|定义功能及验收条件|起草用户故事|核查隐私、安全和异常
product_metrics|设计产品验证指标|辅助实验方案|防止选择偏差与虚假因果
project_delivery|协调发布与复盘|汇总进度风险|核对依赖并承担交付责任''',
 '金融产品可参考BNM已报告的客户分析与运营AI；其他行业采用情况Unknown，不能把所有产品经理当AI产品经理。')

role('marketing',['2431'],'MY-MARKETING;S01;MF-FAIR;BNM-AI',
 'DOSM 2026 Q2 Advertising and Marketing Professionals线上广告40,640条，是职业组广告，不是独立雇主、招聘成功或个人机会数。PERKESO历史列表亦有Marketing Executive。',
 'MyCOL组提名多为junior（1–3年），包含diploma/SKM4及不同背景；学习市场研究、数字渠道、分析与沟通。高级需预算、品牌、实验和客户关系，不把junior等同无经验。',
 'DOSM这里为全国职业组数；未取得州级营销岗位表。KL/Selangor、Penang、Johor、Sabah/Sarawak的细分数量Unknown。',
 '广告量和MyCOL支持需求，但不证明所有营销细分短缺。AI可能压缩重复文案与简单素材制作；本地语言、品牌判断、投放验证和客户数据治理决定适用性。线上广告变动受平台覆盖影响，不能当作长期增长预测。',
 '设计双语小型公益推广实验，保留受众依据、授权素材、渠道指标、预算及失败复盘，不购买个人敏感数据。',
 'data','需补SQL、统计抽样和数据质量；平台指标不自动等于商业效果。',
 '''market_research|分析受众与市场|整理研究摘要|核对样本和本地语境
campaign_design|制定推广策略|生成创意备选|确认品牌、事实和预算
copy_review|制作并审阅双语内容|起草文案版本|核查声明、版权和翻译
product_metrics|跟踪渠道与转化指标|辅助报告和异常提示|排除归因偏差
stakeholder_research|与客户和供应商沟通|汇总需求及进度|确认承诺与真实反馈''',
 'BNM的客户分析AI证据仅适用于金融营销背景；未测量全国营销岗位AI采用率。')

role('business-analysis',['2421','2511'],'MY-BA;MY-SYSTEMS;MF-UX;EMP-IWK;EMP-IPSOS',
 'PERKESO历史Systems Analyst岗位是ICT分支；IWK转型执行和Ipsos研究项目是流程/交付相关本地样本。不能把所有这些样本累计成Business Analyst全国岗位总量。',
 'ICT样本有2–5年经验要求；MyCOL计算机系统分析组偏资深，不代表全部商业分析。学生先训练访谈、流程图、需求规格和验收，补SQL与领域知识。',
 'Shah Alam的历史ICT样本与IWK KL转型样本可核查；其他州份额Unknown。',
 '流程改进与系统数字化提供不同入口，但职称边界模糊。AI整理会议及文档提高效率，核心仍是确认真实流程、利益冲突、指标定义和验收。需要避免只会画图而缺少实施反馈。',
 '观察一个获授权的校园流程，画现状/目标流程，写需求与验收测试，再测一次小改动并记录误差。',
 'product','需补产品发现、优先级与用户实验；组织需求不是自动成立的市场需求。',
 '''process_modelling|梳理现有流程|起草流程图|与执行者核对真实例外
stakeholder_research|访谈业务相关者|摘要授权记录|保留冲突和少数意见
specification|定义系统或流程要求|生成需求草案|追踪每条需求的依据
sql|核对业务数据与指标|辅助查询|检查口径和数据权限
testing|组织验收和改进复盘|生成验收用例|让业务负责人确认结果''')

role('finance',['2413'],'S29;MF-FINANCE;BNM-AI',
 'PERKESO 2026 Penang招聘会的制造雇主列Senior Financial Analyst及finance intern。MyCOL明确包含Financial Analyst/Risk Analyst等，但不同经验、金融机构与制造财务不能混为一类岗位。',
 'MyCOL相关提名以1–3年junior为主，常见相关学位；保险IFRS17和银行信用风险模型存在专业经验门槛。初学先掌握财务报表、Excel建模与验证；没有证据证明所有分析岗位强制CFA。',
 '已核实制造雇主参加Penang招聘会，尚未确认具体工作地点。金融机构、其他州与Sabah/Sarawak的岗位分布Unknown。',
 '本地招聘和短缺证据支持探索，但行业知识是关键差异。AI可整理报表与风险文本，不能替代假设审阅、模型控制与决策责任；常规报告可能重组，高价值工作取决于可审计模型和领域解释。',
 '用马来西亚上市公司公开年报做可追溯财务模型，检查单位、期间及情景假设，并给出模型可能失效的情况。',
 'data','需补SQL、统计验证和数据管线；财务Excel经验不能直接视为数据科学能力。',
 '''financial_modelling|建立财务模型|辅助公式和结构|核对报表、单位和假设
data_quality|核对报表与数据来源|提取表格草稿|逐项对账并保留证据
risk_analysis|分析风险与情景|整理情景备选|判断模型适用性
financial_reporting|撰写分析解释|起草报告|核查会计口径和事实
stakeholder_research|向决策者解释结论|辅助图表与问答|说明不确定性和责任边界''',
 'BNM报告当地金融机构已用AI改善客户分析、运营与风险管理；不等于每位Financial Analyst都采用AI或岗位将减少。')

role('education',['2424','2391'],'MY-TRAINING;EMP-UNITEN',
 'UNITEN历史Instructional Designer招聘证明本地课程设计任务存在。教育方法、企业培训与学校教学不同；未取得该产品职业的全国近期招聘统计，不能把教育产业总广告全算作教学设计。',
 '从学习目标、教学设计、评估和数字课程制作起步；与学科专家合作，保留学习证据。学校教师与其他受规管岗位须另查资格；教学设计作品不赋予教师资格。',
 'UNITEN文档为本地大学样本，校园介绍不能确定该岗位工作地。各重点州职业数量Unknown。',
 '数字课程设计有本地入口，但岗位数量与机构预算不确定。AI能起草题目和教材，需要教师/设计者校验学科准确、评估公平和学习效果；生成更多内容不等于改善学习。',
 '为同学设计一个双语微课，写学习目标、预测试/后测、无障碍材料和专家复核记录；AI题目先验算。',
 'writing','需补技术文档结构、版本控制及产品验证；教学经验不等于技术写作经验。',
 '''instructional_design|分析学习需求|整理需求和目标草案|由学科专家确认
curriculum_design|设计课程和活动|生成结构备选|核对目标与活动一致
asset_production|制作学习材料|起草文本和媒体|核对事实、版权和可访问性
assessment|设计形成性评估|生成题目备选|验证答案和公平性
evaluation|评估学习效果|辅助汇总反馈|判断真实学习与测量偏差''')

role('writing',['2831'],'MY-WRITING;EMP-TERADYNE;BNM-PILOTS',
 'Teradyne于2026-10-15发布Penang Technical Writer制造现场文档岗位，要求2–3年经验；说明专业写作可连接制造质量与工程流程，不能据此声称所有内容写作需求增长。',
 '样本要求英文/马来语、流程理解和EWI/Dozuki等文档工具；先制作能让使用者完成任务的手册。高级需技术验证、版本治理和跨团队访谈。',
 'Bayan Lepas（Penang）现场制造文档岗位已核实；KL/Selangor、Johor、Sabah/Sarawak数量Unknown。该广告不提供签证赞助，限制只适用于该岗位。',
 '专业技术写作有本地样本，常规初稿面临AI压缩。价值在于核对工程事实、可操作说明、版本一致与用户测试；制造文档的错误成本不能以流畅文字代替。',
 '为一项可运行工具写双语操作手册，记录版本、错误案例、真实用户试用和修订；保留每条技术陈述的来源。',
 'education','需补学习目标和有效评估设计；可读性不等于教学效果。',
 '''technical_writing|编写操作和技术说明|起草结构与文字|实际执行每个步骤
stakeholder_research|访谈技术专家|摘要授权访谈|让专家复核技术事实
visual_design|制作图示与说明|辅助图示草案|核查图文与设备一致
version_control|维护版本和变更|生成差异摘要|确保发布版本可追溯
usability_testing|验证说明可操作性|整理用户问题|观察真实执行与安全错误''',
 'BNM的知识/政策助手试点说明当地机构正在测试内容辅助；不证明Teradyne已采用这些工具或写作职业替代率。')

role('health',['2511','2524'],'MY-SYSTEMS;S09;MOH-DIGITAL;EMP-KPJU',
 'KPJ Healthcare University在Nilai的Digital Health Centre经理样本涉及数字健康项目、AI与数据治理；MOH数字化规划提供任务驱动。经理招聘不是毕业生岗位增长统计。',
 '样本接受Digital Health/Health Informatics/AI/Information Systems/Health Sciences等相关学位，3–5年经验。大学生可从非临床系统、数据质量及研究助理作品起步；临床执业资格必须另核实。',
 'Nilai（Negeri Sembilan）样本已核实；重点其他州需求份额Unknown。MOH全国计划不等于每州已招聘同类人员。',
 '健康数据与系统整合有本地机会和明确数据责任，进入需跨临床与技术语言。AI摘要、编码草稿和数据校验需在权限与专家复核下试验；计划项目存在实施、资金和互操作性不确定性。',
 '仅用合成病历做数据字典、权限矩阵、字段映射和质量测试；记录一个AI建议为何被专业审核拒绝，不接触真实患者资料。',
 'data','需补通用统计/SQL与可复现管线；健康知识可迁移，但不能跳过验证。',
 '''process_modelling|梳理健康信息流|起草流程和字段图|与领域专家确认
data_quality|校验健康数据质量|提示编码异常|人工判断语义与缺失
interoperability|设计系统字段映射|辅助映射建议|测试格式与临床含义
data_governance|制定权限和审计方案|起草规则清单|负责人确认用途及访问权限
evaluation|评估数字健康试点|汇总反馈和结果|区分技术准确与临床有效''',
 'MOH 2026–2030规划含Health LLM、注册资料与影像AI等计划；KPJU招聘显示项目与AI相关任务，不构成已完成部署或临床安全证据。')

role('energy',['2151'],'MY-ENERGY;EMP-SUNWAY',
 'Sunway 2026-09-09太阳能技术工程岗位覆盖现场评估、设计、安装与调试；2–5年优先，也考虑有相关项目/实习的应届生。MyCOL电气工程短缺不能全部归到可再生能源。',
 '相关工程学位，电路、能源系统、技术图和测试基础；样本BEM Graduate Engineer是加分项。具体可签署、施工或带电操作资格须按职责另查，不凭本研究认定。',
 'Sunway岗位location字段为Selangor；不能由项目出差推断全国岗位集中。Penang、Johor、Sabah/Sarawak职业数量Unknown。',
 '实际本地工程岗位提供入口，电气技能短缺是辅助证据。AI可帮助设计与故障分析，但现场安全、合规与验收不可自动签署；行业投资、项目延迟及专业资格影响机会。',
 '完成校园屋顶光伏可行性学习项目：公开天气/负载假设、单线图草案、能量估算及敏感性；不进行未授权带电操作。',
 'environment','需补环境影响、监测方法和报告边界；能量模型不替代环境评估。',
 '''electrical_design|设计电气与光伏方案|比较参数备选|工程师核对容量和保护
site_assessment|评估场地和负载|辅助资料整理|现场核查遮挡与结构限制
commissioning|测试和调试系统|起草测试记录|合资格人员执行安全检查
fault_analysis|分析运行故障|检测异常并建议原因|检查传感器和真实设备
project_delivery|协调供应商与交付|汇总进度材料|核对标准、成本和验收''')

role('urban',['2164'],'MY-URBAN;EMP-GDP;MY-PLANNER-BOARD',
 'GDP Architects在KL公开Town Planner岗位，相关学位、3–5年经验、GIS/AutoCAD。这个样本支持本地专业任务，未证明全国或毕业生需求增长。',
 '规划、空间数据、土地使用与政策分析基础；专业注册有Graduate到Registered路径，需实践和相应资格。申请具体类别前核查LPBM，不能把软件技能当法定资格。',
 'KL样本已核实；Penang、Johor、Sabah/Sarawak的规划制度与岗位须各自核查，本库未取得可比职业州级数据。',
 '城市项目需要本地法规、申请和公众沟通知识，AI可辅助空间方案筛选，不能代替现场数据、咨询与规划责任。地产项目周期和注册要求影响进入，不能据智慧城市口号预测岗位增幅。',
 '用开放空间数据比较校园周边两种步行改善方案，记录GIS方法、敏感性、社区反馈与规划限制；学习报告不得冒作法定提交。',
 'policy','需补政策选项、制度研究和可实施性评估；空间图不能独立证明政策效果。',
 '''gis|分析土地和交通空间资料|辅助空间分类|核查坐标、精度和样本
planning_policy|研究规划政策与要求|提取文件草稿|确认最新适用文本
site_assessment|评估发展场地约束|整理环境及人口资料|核实现场与权属限制
stakeholder_research|咨询公众与项目方|整理意见主题|保留异议和代表性
planning_report|编写规划建议与申请材料|起草方案对照|由有资格人员审核责任''')

role('agri',['2132'],'MY-AGRI;MY-FOOD-OA;MYF-AGRI;NAIO-AGRI;MY-SBC',
 '本产品跨农业咨询和食品技术：MYFutureJobs历史食品R&D岗位（LinkedIn副本）要求相关学位、2–5年；SBC植物组织培养研究是另一分支。不得将食品岗位强行全部映射2132，也不能由Rakan Tani项目推出农业岗位增长。',
 '农业分支学土壤、作物、试验设计和农场数据；食品分支学食品科学、配方与质量。高级岗位还需现场/生产经验和专业控制；分支不同不能共用一套资格。',
 '食品样本Negeri Sembilan、植物研究Sarawak有记录；NAIO项目不是各州招聘表。Johor、Penang、Sabah等该职业数量Unknown。',
 '本地农业技术和食品试验存在工作场景，但气候、现场数据质量、生产成本与食品安全限制AI应用。可迁移能力是实验、数据记录和质量控制；建议先选分支，再取得领域项目经验。',
 '农业分支做小规模植物观测并预先写采样与对照；食品分支在合规教学实验室记录配方试验和质量结果；AI只建议分析，不给未经验证的施药或食品安全指令。',
 'environment','需补环境采样、污染指标和法规边界；作物试验不能替代环境评估。',
 '''field_experiment|设计农艺观测或食品试验|建议对照与记录表|专业教师审核方法与安全
data_quality|记录产量或质量数据|标出异常与缺失|核查仪器和原始记录
crop_science|分析作物与生产问题|辅助文献检索|现场诊断和专业验证
quality_assurance|评估生产与质量改进|整理试验比较|遵守实验和生产审批
extension|向农户或生产团队解释建议|起草双语指导|核查适用地点和风险''',
 'NAIO Rakan Tani是本地AI农业项目启动证据，不是行业采用率或产量收益证据。食品分支采用情况Unknown。')

role('water',['2143'],'MY-WATER;EMP-IWK',
 'IWK 2026历史招聘包含Melaka处理工程职位，关注污水处理运行与出水；MYStep化学毕业生实验室任务是不同入口。未获得全国Water Management职业岗位总数。',
 '处理工程样本相关工程学位及1–3年；实验室样本偏化学及检测。先学水质、处理流程、质量控制和现场安全；高级需工艺诊断、项目与运行责任。',
 'Melaka处理工程样本可核查；本库对KL/Selangor、Penang、Johor、Sabah/Sarawak未取得该职业可比州级数量。',
 '水务运行有持续公共服务场景和本地招聘证据，但项目/运营岗位边界不同。AI可以异常预警和记录辅助，传感器漂移、工艺变化与公共健康风险要求现场核查；不能把算法报警直接变成操作指令。',
 '用公开或合成水质时间序列做异常检测仪表板，保留单位、校准、缺失与误报；模拟事件升级，不操控真实处理设备。',
 'environment','需补生态影响、环境监测和报告框架；处理工艺知识不是全部可持续分析。',
 '''water_process|分析污水处理过程|比较运行模式|核查真实工艺与安全边界
environmental_monitoring|监测水质与出水|辅助异常提示|校准采样和仪器
quality_assurance|核对实验检测质量|生成质控清单|保留样品与标准记录
fault_analysis|调查运行异常|归纳可能原因|现场验证后确定措施
technical_writing|记录事件与维护建议|起草运行报告|负责人确认并追溯数据''')

role('marine',['2131','2133'],'MY-BIO;S10;EMP-REEF;EMP-REEF-WORK',
 'Reef Check Malaysia有珊瑚监测与社区保育项目，但核验时招聘页明确没有空缺。证明实际工作场景，不证明当前有付薪岗位或全国需求为零；本次没有取得可比海洋保育招聘时间序列。',
 '生物/环境基础、物种辨识、监测与社区合作；先通过受督导、符合安全要求的项目积累记录。潜水/出海安全及研究许可必须逐项目核实，不把志愿经历承诺为就业。',
 '组织项目包括Semporna、Mantanani（Sabah）、Mersing及南Johor、Tioman/Redang；这些是项目地，不是岗位数量或当前工作地点。KL办公室亦不代表全部现场工作在KL。',
 '这是专业而可能规模较小的项目型路径，现有证据不足以判断全国招聘增长。AI可辅助影像分类和监测清洗，但物种误识、能见度、采样偏差及社区关系需要人负责；应并行探索环境数据和项目协调能力。',
 '用有授权的珊瑚图像做标注质量审查，记录误识与采样条件；与受督导保育团队合作，公开数据仅在许可范围内发布。',
 'biodiversity','需补陆域物种、调查设计与当地许可；海洋辨识不能直接替代陆域生态经验。',
 '''species_identification|辨识海洋生物和底质|建议图像分类|专业人员复核误识
field_sampling|执行海洋监测记录|辅助采样计划|现场安全与方法由负责人审核
data_quality|整理监测与影像资料|标记重复和异常|追溯原始记录及地点敏感性
community_engagement|协作岛屿社区与保育伙伴|起草双语材料|尊重授权与当地知识
ecological_reporting|解释珊瑚与污染观察|辅助图表报告|说明采样偏差且不推断全海域''')

role('biodiversity',['2131','2133'],'MY-BIO;S10;MY-SBC;EMP-GEC',
 'SBC 2026年9月Research Officer Q9历史岗位涉及ethnobiology与植物组织培养；GEC有生态恢复及社区项目工作。一个政府机构样本不能推断全国岗位总量或持续招聘。',
 'SBC样本相关BSc，1–3年经验优先，部分更高学历优先；先学生态、调查、数据和研究伦理。高级需研究设计、许可、团队及项目报告，不把实验室技术等同全部保育工作。',
 'Sarawak的SBC样本有直接证据；GEC也有Sabah/Sarawak项目类型。其他重点州职业数量Unknown，项目与雇佣地点分开。',
 '本地研究和恢复项目提供专门入口，资金和项目周期使稳定性不确定。AI能辅助物种分类、文献和空间分析，但稀有物种误识、原住民知识授权与现场验证限制自动化；应保留可审查的研究链。',
 '在获许可地点或公开影像上做物种观察台账，记录鉴定置信、复核、地点保护和一次恢复效果比较；不公开敏感物种位置。',
 'environment','需补污染监测、环境影响与管理报告；生物知识不是全部环境专业要求。',
 '''field_sampling|规划并执行生态调查|建议调查表|核查许可与代表性
species_identification|记录和鉴定物种|辅助影像检索|专家确认分类
gis|分析栖息地分布|辅助空间分类|核查尺度与敏感地点
research_ethics|管理样本与传统知识授权|整理同意记录|尊重访问与利益分享要求
ecological_reporting|评估恢复或研究结果|汇总趋势图文|区分观察与因果''')

role('social-impact',['2425','2825'],'MY-ADMIN;MY-SOCIAL;EMP-GEC',
 'GEC本地社区发展与项目执行岗位体现NGO programme工作的需求；高级岗位经验要求较高。本产品不等于全部社会工作/心理咨询，不能据NGO项目推断持牌咨询资格或全国紧缺。',
 '先训练社区需求访谈、项目预算、资料保护及效果评估；学生可搜索programme intern/assistant等类型。资深需要现场关系、资金方报告与管理经验；涉及咨询业务须另外核实资格。',
 'GEC有Pekan Pahang及Sabah/Sarawak等不同项目岗位样本；不能推断各州相同岗位数量，KL/Selangor等职业份额Unknown。',
 '社区项目有实际本地工作场景，资金持续性、语言和信任关系是关键门槛。AI可辅助记录与资助报告，但不能生成虚假受益人故事、替代同意或证明项目有效；需要可解释的评估设计。',
 '与获同意的校园/社区组织定义一个需求，设计小型活动预算、参与者保护、反馈与效果限制；不收集不必要的敏感个人资料。',
 'partnerships','需补伙伴尽调、协商和长期关系管理；做活动不等于已取得筹资能力。',
 '''community_engagement|了解社区需求和授权|归纳经同意的访谈|社区核对代表性
project_delivery|规划并执行社区活动|辅助工作计划|负责人核对安全与资源
budgeting|管理项目预算与记录|草拟费用分类|核查凭证和资助条件
evaluation|评估参与及项目结果|辅助反馈分析|不把参与人数当社会效果
technical_writing|编制项目和资金方报告|起草报告|核对真实成果并保护个人资料''')

role('policy',['2422'],'MY-POLICY;EMP-ISIS;BNM-PILOTS',
 'ISIS Malaysia公开Senior Analyst Cyber & Technology Policy等研究岗位；5–7年与高级学历门槛是资深样本，不是全部政策助理门槛。法律政策产品方向尚不能直接映射到律师或承诺法律执业。',
 '先掌握制度研究、统计/定性方法、政策选项比较和写作；高级要求领域研究、发表和相关者沟通。ISIS相关招聘限定Malaysian citizen，只适用于这些岗位。',
 '本地智库岗位为Malaysia样本；未取得职业州级表。不能推断所有政策岗位在首都或所有学生具有同等申请资格。',
 '本地技术政策研究有具体需求，但资深和国籍限制影响可进入性。AI可加快文件检索、对照和摘要，必须核对法律效力、版本与价值取舍；政策分析不能把语言模型意见作为公众意见。',
 '选择一项Malaysia公开政策，用原文建立问题、证据、两个选项、利益相关者影响与不确定性备忘录；标注条文版本和AI错误。',
 'social-impact','需补社区实施、预算和效果评估；研究建议不等于已验证可行的项目。',
 '''policy_research|检索政策和制度资料|辅助摘要和关键词|核对原文及适用期间
stakeholder_research|分析利益相关者需要|整理咨询主题|保留异议且不伪造民意
evaluation|比较政策选项和风险|生成比较框架|判断因果和可实施性
technical_writing|撰写政策备忘录|起草结构|研究者核对证据与措辞
data_governance|维护研究资料和引用|辅助引用清单|检查出处、版本和保密''',
 'BNM PolicyBot等是受控机构试点；为政策资料辅助提供本地例子，不能证明全部智库已采用或法律文本可以免复核。')

role('partnerships',['2432','2425'],'MY-PR;MY-ADMIN;EMP-GEC;MF-FAIR',
 'PERKESO历史CARSOME列表含Events & Partnership，GEC工作涉及本地政府、企业、NGO与社区伙伴。商业合作与公益伙伴职责不同，不能合并成统一岗位量或短缺判断。',
 '先学双语沟通、伙伴研究、项目协调和记录；高级需协商、风险判断、承诺管理及领域经验。岗位是否涉及筹资、销售或法定签署应另核查。',
 'GEC现场项目有Pahang与Sabah/Sarawak背景；CARSOME招聘会地点不能当工作地点。各州该职业数量Unknown。',
 '本地跨机构项目确实需要协调，但关系质量、资金周期与行业经验决定可进入性。AI可辅助伙伴检索、会议纪要与报告，不能代替信任、尽调、协商和正式授权；共享联系人数量不等于合作成果。',
 '为校园公益项目拟伙伴地图、可核实价值主张、尽调问题、会议记录和承诺跟踪表，未经授权不外发或代表组织承诺。',
 'social-impact','需补社区保护、项目设计与成效评估；商业沟通能力不等于服务专业性。',
 '''stakeholder_research|研究潜在合作方|汇总公开背景|核对身份和利益冲突
negotiation|比较合作范围及资源|起草讨论选项|授权人员谈判和确认承诺
project_delivery|协调双方任务与进度|整理纪要及提醒|核对责任人与履行情况
technical_writing|编制合作方案与报告|起草双语材料|核查事实与授权
evaluation|复盘伙伴合作结果|汇总反馈和指标|区分活动规模与真实效果''')

# Add two task dimensions to each preserved pilot; original analyses remain intact.
PILOT_TASKS = {
 'software':('S05;S08', '''specification|确认需求和接口边界|起草需求与接口说明|与使用者核对权限和例外
maintenance|维护并排查生产缺陷|辅助日志归纳|复现、回归并审核发布'''),
 'ai-research':('S09;S16', '''data_governance|管理训练数据与版本|生成数据说明草稿|核查授权、偏差和泄漏
model_monitoring|监测模型上线偏移|提示性能异常|确认分布变化并决定回滚'''),
 'environment':('S07;S10', '''field_sampling|设计并记录现场采样|辅助采样计划|核查方法、仪器与安全
technical_writing|编制环境解释与建议|起草报告结构|核对原始监测、边界与责任''')
}

MASCO = {
 '2524':('Data Professionals','Profesional Data','S09'),
 '2531':('Cyber Security Professionals','Profesional Keselamatan Siber','MY-CYBER'),
 '2543':('Creative Content Designer Professionals','Profesional Pereka Kandungan Kreatif','MY-UX'),
 '2166':('Graphic and Multimedia Designers','Pereka Grafik dan Multimedia','MY-CREATIVE'),
 '2542':('Digital Games and E-sports Professionals','Profesional Permainan Digital dan E-Sukan','MY-GAME'),
 '2512':('Software Developers','Pembangun Perisian','S05'),
 '2421':('Management and Organisation Analysts','Juruanalisis Pengurusan dan Organisasi','MY-BA'),
 '2425':('Administration Professionals','Profesional Pentadbiran','MY-ADMIN'),
 '2511':('Computer Systems Analysts','Juruanalisis Sistem Komputer','MY-SYSTEMS'),
 '2431':('Advertising and Marketing Professionals','Profesional Pengiklanan dan Pemasaran','MY-MARKETING'),
 '2413':('Financial Analysts','Juruanalisis Kewangan','S29'),
 '2424':('Training and Staff Development Professionals','Profesional Pembangunan Latihan dan Kakitangan','MY-TRAINING'),
 '2391':('Education Methods Specialists','Pakar Kaedah Pendidikan','S31'),
 '2831':('Authors and Related Writers','Pengarang dan Penulis yang Berkaitan','MY-WRITING'),
 '2151':('Electrical Engineers','Jurutera Elektrik','MY-ENERGY'),
 '2164':('Town and Traffic Planners','Perancang Bandar dan Lalu Lintas','MY-URBAN'),
 '2132':('Farming Forestry Agricultural and Fishery Advisers','Penasihat Perladangan, Perhutanan, Pertanian, dan Perikanan','MY-AGRI'),
 '2143':('Environmental Engineers','Jurutera Alam Sekitar','MY-WATER'),
 '2131':('Biologists Botanists Zoologists and Related Professionals','Profesional Biologi, Botani, Zoologi dan Profesional Berkaitan','MY-BIO'),
 '2133':('Environmental Protection Professionals','Profesional Perlindungan Alam Sekitar','S07'),
 '2825':('Social Work and Counselling Professionals','Profesional Kerja Sosial dan Kaunseling','MY-SOCIAL'),
 '2422':('Policy Administration Professionals','Profesional Pentadbiran Dasar','MY-POLICY'),
 '2432':('Public Relations Professionals','Profesional Perhubungan Awam','MY-PR')
}
