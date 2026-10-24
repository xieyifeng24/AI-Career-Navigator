# Malaysia Career Intelligence 接入说明

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
