# Malaysia Career Intelligence 接入说明

## 当前版本：24职业桌面研究与实际V2接入

`malaysia-intelligence-2026-10-23-24-v1`覆盖原24个ID、120项任务族、171条专业/AI支持要求、72条条件情景和80条来源登记。研究有明确Unknown，不是完整岗位普查、预测模型或个人评分。下方旧“三职业衔接”说明为历史审计；当前状态以本节及`analysis_model.research_coverage`为准。

代码在用户最终确认可继续的当前PR #13来源分支`codex/restore-v2-reports-preserve-intake-sdg`上完成；没有创建、切换、合并或删除分支，没有修改main。基线提交337abca0848a03c2092061b572f705035c8b127d。

### 无损衔接

`pilot-original.json`逐字节保留；原12表的所有行保持原样，新研究仅追加行/表。`pilot-original.xlsx`及三份中文报告也从实际交付复制保留。旧目录research_status和原ReadMe是历史字段，不能代表当前覆盖；工作簿Research Status单列当前状态。原schema_version作为兼容标识保留，新增extension_schema_version=2.0-additive，不破坏旧字段。跨表键为(table,record_id)。

旧04-010混合事实/建议、02-005待核O*NET关联等问题保留审计；新增实践要求标INFERENCE。S03原全文抓取限制未涂改，新增S03-FULL记录本轮212页PDF下载及相关叙述核查，原文件SHA256在source-file-manifest.json；部分图像页标题未OCR核验。

### 六条可追溯分析链

| 分析 | 数据与规则 | 不可跨越的边界 |
|---|---|---|
| 市场 | 原始观测→需求解释→前景综合判断 | 广告、投资、政策与雇主样本不可累加；无增长率/失业概率 |
| AI | 本地任务→辅助步骤→人工责任→适用条件 | 国际暴露不是Malaysia采用率；机构试点不是全国部署 |
| 技能与关系 | 两端任务要求→共同技能、专业差异、剩余要求 | 无相似度权重或转型成功率；SDG沿用产品标签，非独立验证的职业贡献 |
| 缺口 | 明确布尔自述→unknown/reported_gap/reported_met | true仍是自述，verified_ability=false；程度问卷不转技能 |
| What If | 明确假设＋必要条件all_of→conditional/unmet/unknown | 全真才conditional；其他要求、资格和市场事实不变 |
| 成长 | 未知先索取作品依据；明确缺口安排对应实践 | 不保证录用、许可、实习或国际学生工作资格 |

政府职业资料、统计和政府招聘材料标MY-OFFICIAL；企业/NGO招聘标RESEARCH；职业映射、任务选择、AI与成长推断标INFERENCE；缺失事实标UNKNOWN。原始数值与分析分开，来源条数不是独立招聘观测次数。

### 当前V2实际读取路径

1. `src/career/api.py`只新增固定公开路径`GET /data/malaysia_intelligence/current.json`及一个允许的JS模块。缺失文件返回503/unavailable，不开放任意仓库文件。
2. `prototype/combined/app.js`挂载时异步读取本地快照，6秒超时；HTTP失败、无效JSON/引用回退为unavailable，不阻塞问卷。卸载后不异步重绘。加载不会修改Last Verified，也不刷新外部研究。
3. `malaysia-intelligence.js`验证真实24ID、来源、记录和规则，复制输入。`buildCompatibleReport`新增`report.malaysiaIntelligence`，保留既有report/ranking/exploration/signals/companions。directionRoles只选背景，不评分；其余职业仍可展开。
4. careers/ai/tree/future/plan沿用原样式追加可折叠本地研究，JSON导出包含同一数据。旧O*NET/ESCO仍为补充。三语标题和说明保留；研究正文按要求为中文并标lang=zh-CN，没有声称正文已翻译。

独立JS接口：`await loadMalaysiaIntelligence()`；`analyseMalaysiaCareer('data',{skills:{sql:false}},{skills:{sql:true}})`。第三个对象只是假设，SQL的basis为hypothetical，不写入自述。V2组合函数第四个参数为`{profile,assumptions}`，与原第三个规划参数隔离。未新增技能采集表单；当前问卷无法验证技能时全部unknown。始终显示basis，不能把conditional说成已获资格或提高匹配分。

情景面板现在逐项提供“保持当前证据／假设满足／假设不满足”控件，每次只改变该技能、项目或授权/复核条件，重新计算同一规则；其他未报告条件保持unknown。它只编辑内存中的临时假设，不把用户技能写为已掌握，导出带hypothetical依据。原What If规划控件与新职业情景控件分别处理，未改写旧模拟算法。

原样板勘误以`record_overrides`显式记录。Python/JS读取、Excel和CSV导出应用有效标签；原表行和pilot-original仍保留审计历史。直接读取原始tables的调用方也必须应用覆盖，尤其04-010不得作为整条官方统计，02-005的O*NET关联仍未核实。

Python CLI仍可用：`python -m src.malaysia_intelligence water`；`Intelligence().assess(id,profile,assumptions)`同时返回分类、市场、薪资/门槛、地区、任务、AI、要求、状态、情景引用和剩余目标要求。没有新远程推理服务。

### 职业差异与尚未核实的事实

- 写作MASCO为2831，UX对应2543组的2543-03，不能套国际代码。健康2511/2524、产品2425/2421/2511、社区项目2425/实际社会工作2825等为条件映射。食品科学/加工、法律执业等子分支仍须按具体JD核查，不宣称整个宽泛产品名称已有唯一精确代码。
- MyCOL数据、安全、金融、营销、电气、创意/游戏相关组的提名及经验条件各异；未确认同名不等于未入选或无前景。受访企业结论不扩成所有企业。
- 大多数职业精确薪资、入门/高级分布、州级职业份额和AI采用率仍Unknown。null不变RM0；州平均工资、政策工资、混合Data/AI组和零薪资控件不能替代具体岗位薪资。security的RM2700–3300/月仅是混合IT支持/安全/行政广告。
- 地区严格区分岗位地、项目地、招聘会场地和投资地。Reef Check无当前空缺不是全国海洋职业需求为零；志愿项目不算付薪岗位。BNM试点是实际机构例子，MOH/NAIO计划是计划或启动，非行业普遍部署。
- 大学生路线与项目有职业差异，但不保证课程开放、实习资助或就业准证；申请资格单独核查。多数AI任务影响仍为有条件推断，无替代率或成功概率。

### 可维护更新与验证

先人工核验，再修改`research-notes.json`和`scripts/malaysia_research_specs.py`及版本，运行：

```sh
python scripts/build_malaysia_pilot.py data/malaysia_intelligence/pilot-original.json
python scripts/extend_malaysia_research.py
python scripts/export_malaysia_delivery.py /absolute/output --pilot-delivery /absolute/original-pilot --raw-sources /absolute/raw-source-directory
python -m unittest discover tests -v
node --test prototype/*.test.mjs
```

扩充脚本拒绝重复追加；须先重建bridge。JSON/CSV同源，嵌套CSV规则用JSON字符串。Excel由export_malaysia_workbook.mjs调用Codex bundled artifact-tool导出，不参与运行时。

测试覆盖24ID/原名称、原行无损、每职业五项任务/三规则、逐条件缺失/false、剩余要求、假设隔离、引用、缺失/损坏/更新、V2实际读取、三语渲染及旧评分/SDG。测试证明程序和引用链工作，不证明所有职业事实已穷尽。Windows另将原作者文本哈希按LF比较（题库未修改），给旧知识同步锁补msvcrt路径；Linux仍用fcntl，不改变数据更新、评分或AI算法。

## 历史记录：原三职业衔接阶段

以下原文只描述此前阶段，不是当前交付状态；保留以便复核研究方法和当时限制。

本版为三个已有示范职业的兼容衔接与逻辑验证，不是24职业完成版。研究目录保留24项；21项仍缺完整本地化研究。没有把目录存在、接口能返回或测试通过当成研究完成。

## 基础和边界

开发基础是PR #13的现有分支 `codex/restore-v2-reports-preserve-intake-sdg`，起点提交 `337abca0848a03c2092061b572f705035c8b127d`。没有创建新分支。只新增 data/malaysia_intelligence、src/malaysia_intelligence、一个导入脚本、一个测试和本文档。未接线前端、未修改现有API、V2报告、12题或评分。

## 实际读取与研究判断

已有JSON、CSV及三份中文报告存在。JSON包含12表、35来源、27项九维摘要、9任务级AI记录、18条路线/情景、11条关系、18条原始观测。Excel是同一批研究的审阅载体；本轮分析以JSON及中文报告为主，没有重新运行Excel的视觉验收，也没有将读取JSON称为复核全部网页。

软件：09-001、09-002提供两个季度2512广告观测，03-002的变化解释可追溯至这些数字；无法由两点趋势预测未来就业。MyCOL可说明相关职称的短缺，不能证明所有毕业生短缺。

AI：S16本地雇主岗位与S09的任务描述支持数据管线、模型评估和交付技能。S11是投资关联就业，不能当作AI工程师广告数；S33合并组工资不能标成单独AI职业工资。

环境：03-009是PERKESO单次历史招聘存在性证据；03-011的BNM气候金融背景支持可能的任务驱动，不证明全国环境职业短缺。现场采样、报告数据与金融气候分析需要分别处理。

可复用的是证据分类、范围限制、显式条件及引用链；不能复用的是职业映射结果、现场/法规责任、岗位技能、地区集中度和入门资格。

## 无损兼容

`pilot-original.json`逐字节保留导入文件；`current.json`的原tables完整保留，新增analysis_model和import_provenance。原schema_version保持1.0-pilot，分析扩展版本单独存于analysis_model.version，不能假定老读取方理解新增字段。原record_id在表内唯一，跨表引用始终为(table, record_id)。保留原职业ID。

新增requirements只有12条人工明确的技能练习要求，来源仍是INFERENCE，而非通用法定入职条件。新增9条scenarios有all_of、record_refs和解释，没有个人评分、暴露分或前景分。模型技能ID为独立语义ID，不改产品评分标签。

## 六条分析链

1. 就业数据→市场：读取Malaysia Job Demand，连到Raw Observations与来源。必须保留地区、期间、职业组及广告/投资/政策的计量差异。引擎只返回已审阅解释，不以链接数计算前景。
2. 任务技能→AI：返回Malaysia AI Transformation的任务、可能变化、人类责任、适用条件及国际边界。AI分析仍为INFERENCE，不改成官方采用率。
3. 技能差异→转型：使用Career Relations的解释边和目标任务证据。仅三个示范的部分边已研究，不以共享标签数量算转型成功率。
4. 职业要求→技能缺口：只接受用户明确的布尔技能陈述。缺失为unknown，明确false才是reported_gap，true只是reported_met，均非能力认证。
5. 技能变化→What If：所有条件都为true才返回conditional；有false为unmet，其余unknown。用户陈述和临时假设分开，临时假设不覆盖原资料、不改变市场事实。所有条件仍是研究者规划条件，不是经验验证的预测规则。
6. 用户现状→行动：缺少信息时请求实践证据，明确差距时建议对应练习，已有自述时不重复安排相同基础练习。建议引用原记录，不推断国籍、工作资格或熟练度。

## 程序读取

在仓库根目录运行：

```sh
python scripts/build_malaysia_pilot.py /absolute/path/malaysia_career_pilot.json
python -m unittest tests.test_malaysia_intelligence -v
python -m src.malaysia_intelligence software
```

可选profile JSON：

```json
{"skills":{"sql":true,"api":false},"projects":{},"conditions":{}}
```

调用：`python -m src.malaysia_intelligence software --profile profile.json --assumptions assumptions.json`。API适配方也可在服务端直接调用 `Intelligence().assess('software', profile, assumptions)`。没有运行HTTP服务或改动原FastAPI应用；这个函数是独立、无网络、无磁盘写入的分析接口。

返回market、ai_tasks、requirements、skill_gaps、scenarios、next_actions与原始引用。scenario.evidence提供原记录和来源。outlook_score和ai_exposure_score为null，personal_fit为not_assessed。

## V2接入位置和限制

实际读取了prototype/combined/v2-report.js及current-analysis.js。当前报告通过buildCompatibleReport获得原报告，通过analyzeCurrentAnswers保留问卷原始陈述、构念与程度，明确不测量已验证技能。这些程度值不能被适配器转换为本接口的技能true/false。当前directionRoles也不是24职业完整映射，不能据此自动声称全部职业已经接入。

后续开发者应在报告数据组合层读取独立职业结果，作为Malaysia背景和条件建议补充，与原SDG/个人规则结果并列。按occupation_id精确连接，找不到映射就展示未关联，不按名称猜测。先增加单独profile技能证据输入契约，经产品授权后再接UI。本阶段没有改这些主体。

缺少用户技能证据时返回unknown并提出可完成的作品；不把问卷不同意或不熟悉视为缺技能。国籍/许可单独返回not_determined，历史课程资格不能判断当前学生的就业资格。调用方不得把conditional显示为已获得资格、提高匹配分或就业成功。

## 待修研究链路

- 07-012指向环境路线，但原source_ids主要仍是AI、学习和实习资料。新增情景record_refs补入04-010，原文保留；跨域转型仍需环境领域验证，不宣称已有完整对照。
- 07-018目标data的完整职业研究还未完成，不能展示为经完整验证的转型路径。
- 04-010把广告事实和“优先学习”建议写在同一个MY-OFFICIAL条目里。新增要求统一标为INFERENCE；后续原数据清理应分拆事实与建议，保留原记录对应关系。
- 02-005的部分O*NET代码仍注明待核验，不应作为已审阅等价映射使用。
- S03含仅索引可读的限制，不能将本地导入视为重新成功获取全文；Last Verified保留原日期及访问方式。
- 原始观测中的职业ID有时代表产品关联、而统计实际属于MASCO组/投资项目。后续补充结构化measured_population和relation_kind字段，不能单按occupation_id聚合。

## 剩余21职业发布门槛

每项须先取得适用的本地分类与任务证据，再核实招聘/短缺/行业驱动的适用范围；不能以通用ILO或投资消息填满所有分析。要求、任务、AI变化、实践和情景逐条关联。原表新增行，不重建不兼容结构。补证失败明确记录研究缺口，不把Unknown当作完成完整研究的替代。

测试只证明无损导入、显式条件、未知区分、引用可解析、假设隔离与不产生评分，不证明职业结论准确或市场数据最新。尚未完成全24研究、前端接入、生产部署或远程提交。
