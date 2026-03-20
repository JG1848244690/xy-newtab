---
name: skill-creator
description: 交互式技能创建指南。帮助用户从头开始创建、验证和改进 Claude Skills。涵盖技能规划、YAML frontmatter 生成、指令编写、触发词优化、测试验证和迭代改进。当用户说"创建一个skill"、"写个skill"、"帮我做技能"、"skill指南"时使用。
metadata:
  author: Anthropic Guide
  version: 1.0.0
  category: development
  tags: [skills, automation, workflow]
---

# Skill Creator - 交互式技能创建指南

这是一个基于 Anthropic 官方指南的技能创建助手，帮助您构建高质量的 Claude Skills。

## 核心概念

### 什么是 Skill？

Skill 是一个文件夹，包含：
- `SKILL.md`（必需）：带有 YAML frontmatter 的 Markdown 指令
- `scripts/`（可选）：可执行代码
- `references/`（可选）：文档引用
- `assets/`（可选）：模板、字体、图标

### 三大设计原则

1. **渐进式披露**
   - 第一层（YAML frontmatter）：始终加载，让 Claude 知道何时使用
   - 第二层（SKILL.md 正文）：相关时加载，包含完整指令
   - 第三层（引用文件）：按需加载

2. **可组合性**
   - Skill 应该能与其他 skill 并存工作
   - 不要假设它是唯一可用的能力

3. **可移植性**
   - 在 Claude.ai、Claude Code 和 API 中完全相同地工作

---

## 技能创建流程

### 第一步：定义用例

在编写任何代码之前，确定 2-3 个具体用例。

**好的用例定义示例：**

```
用例：项目冲刺规划
触发：用户说"帮我规划这个冲刺"或"创建冲刺任务"
步骤：
1. 从 Linear 获取当前项目状态（通过 MCP）
2. 分析团队速度和容量
3. 建议任务优先级
4. 在 Linear 中创建带有标签和估算的任务
结果：完全规划好的冲刺，任务已创建
```

**问自己：**
- 用户想要完成什么？
- 需要什么多步骤工作流程？
- 需要哪些工具（内置或 MCP）？
- 应该嵌入什么领域知识或最佳实践？

---

### 第二步：创建文件夹结构

```bash
your-skill-name/
├── SKILL.md          # 必需 - 主要技能文件
├── scripts/          # 可选 - 可执行代码
│   ├── process_data.py
│   └── validate.sh
├── references/       # 可选 - 文档
│   ├── api-guide.md
│   └── examples/
└── assets/           # 可选 - 模板等
    └── template.md
```

**关键规则：**
- 文件夹名必须使用 kebab-case：`my-skill` ✅
- 不能有空格：`My Skill` ❌
- 不能有下划线：`my_skill` ❌
- 不能有大写：`MySkill` ❌
- SKILL.md 必须完全匹配（区分大小写）

---

### 第三步：编写 YAML Frontmatter（最重要！）

YAML frontmatter 是 Claude 决定是否加载您的 skill 的方式。

**最小必需格式：**

```yaml
---
name: your-skill-name
description: What it does. Use when user asks to [specific phrases].
---
```

**完整示例：**

```yaml
---
name: figma-design-handoff
description: 分析 Figma 设计文件并生成开发者交接文档。当用户上传 .fig 文件、要求"设计规范"、"组件文档"或"设计到代码交接"时使用。
metadata:
  author: DesignTools
  version: 1.0.0
  mcp-server: figma-connector
  category: design
  tags: [figma, documentation, design-handoff]
---
```

**字段要求：**

| 字段 | 必需 | 要求 |
|------|------|------|
| `name` | ✅ | kebab-case，无空格，无大写 |
| `description` | ✅ | 包含功能描述 + 触发条件，< 1024 字符 |
| `license` | ❌ | 开源时使用（MIT、Apache-2.0） |
| `compatibility` | ❌ | 环境要求，1-500 字符 |
| `metadata` | ❌ | 自定义字段 |

**安全限制：**
- ❌ 禁止 XML 尖括号（`< >`）
- ❌ 禁止名称中包含 "claude" 或 "anthropic"（保留）

---

### 第四步：编写有效指令

**描述字段结构：**

```
[功能描述] + [何时使用] + [关键能力]
```

**好的描述示例：**

```yaml
# 好 - 具体且可操作
description: 分析 Figma 设计文件并生成开发者交接文档。当用户上传 .fig 文件、要求"设计规范"、"组件文档"或"设计到代码交接"时使用。

# 好 - 包含触发词
description: 管理 Linear 项目工作流程，包括冲刺规划、任务创建和状态跟踪。当用户提到"冲刺"、"Linear 任务"、"项目规划"或要求"创建票据"时使用。

# 好 - 清晰的价值主张
description: PayFlow 的端到端客户入职工作流程。处理账户创建、支付设置和订阅管理。当用户说"入职新客户"、"设置订阅"或"创建 PayFlow 账户"时使用。
```

**不好的描述示例：**

```yaml
# 太模糊
description: 帮助处理项目。

# 缺少触发词
description: 创建复杂的多页文档系统。

# 太技术化，无用户触发
description: 实现具有层次关系的 Project 实体模型。
```

---

### 第五步：编写主指令模板

```markdown
---
name: your-skill
description: [你的描述]
---

# Your Skill Name
## Instructions

### Step 1: [First Major Step]

Clear explanation of what happens.

**Example:**
```bash
python scripts/fetch_data.py --project-id PROJECT_ID
```

**Expected output:** [describe what success looks like]

### Step 2: [Second Major Step]
[Continue as needed]

---

## Examples

### Example 1: [common scenario]

**User says:** "Set up a new marketing campaign"

**Actions:**
1. Fetch existing campaigns via MCP
2. Create new campaign with provided parameters

**Result:** Campaign created with confirmation link

---

## Troubleshooting

### Error: [Common error message]
**Cause:** [Why it happens]
**Solution:** [How to fix]

---

## Best Practices

### Be Specific and Actionable

✅ **Good:**
运行 `python scripts/validate.py --input {filename}` 检查数据格式。
如果验证失败，常见问题包括：
- 缺少必填字段（添加到 CSV）
- 无效的日期格式（使用 YYYY-MM-DD）

❌ **Bad:**
在继续之前验证数据。

### Include Error Handling

### Common Issues

#### MCP Connection Failed
如果看到 "Connection refused"：
1. 验证 MCP 服务器正在运行：检查 Settings > Extensions
2. 确认 API key 有效
3. 尝试重新连接：Settings > Extensions > [Your Service] > Reconnect

### Reference Bundled Resources Clearly

在编写查询之前，查阅 `references/api-patterns.md` 了解：
- 速率限制指导
- 分页模式
- 错误代码和处理

### Use Progressive Disclosure

保持 SKILL.md 专注于核心指令。将详细文档移到 `references/` 并链接到它们。
```

---

## 三种常见技能模式

### 模式 1：顺序工作流程编排

**使用场景：** 用户需要按特定顺序的多步骤流程。

```markdown
## 工作流程：入职新客户

### Step 1: 创建账户
调用 MCP 工具：`create_customer`
参数：name, email, company

### Step 2: 设置支付
调用 MCP 工具：`setup_payment_method`
等待：支付方式验证

### Step 3: 创建订阅
调用 MCP 工具：`create_subscription`
参数：plan_id, customer_id（来自 Step 1）

### Step 4: 发送欢迎邮件
调用 MCP 工具：`send_email`
模板：welcome_email_template
```

**关键技巧：**
- 明确的步骤顺序
- 步骤之间的依赖关系
- 每个阶段的验证
- 失败时的回滚指令

---

### 模式 2：多 MCP 协调

**使用场景：** 工作流跨越多个服务。

```markdown
## Phase 1: 设计导出（Figma MCP）
1. 从 Figma 导出设计资源
2. 生成设计规范
3. 创建资源清单

## Phase 2: 资源存储（Drive MCP）
1. 在 Drive 中创建项目文件夹
2. 上传所有资源
3. 生成可共享链接

## Phase 3: 任务创建（Linear MCP）
1. 创建开发任务
2. 将资源链接附加到任务
3. 分配给工程团队

## Phase 4: 通知（Slack MCP）
1. 向 #engineering 发布交接摘要
2. 包含资源链接和任务引用
```

**关键技巧：**
- 清晰的阶段分离
- MCP 之间的数据传递
- 进入下一阶段前验证
- 集中式错误处理

---

### 模式 3：迭代优化

**使用场景：** 输出质量通过迭代提高。

```markdown
## 迭代报告创建

### 初始草稿
1. 通过 MCP 获取数据
2. 生成第一份报告草稿
3. 保存到临时文件

### 质量检查
1. 运行验证脚本：`scripts/check_report.py`
2. 识别问题：
   - 缺少的部分
   - 格式不一致
   - 数据验证错误

### 优化循环
1. 解决每个识别出的问题
2. 重新生成受影响的部分
3. 重新验证
4. 重复直到达到质量阈值

### 最终确定
1. 应用最终格式化
2. 生成摘要
3. 保存最终版本
```

**关键技巧：**
- 明确的质量标准
- 迭代改进
- 验证脚本
- 知道何时停止迭代

---

## 测试和验证

### 测试检查清单

**1. 触发测试**
- ✅ 在明显任务上触发
- ✅ 在改写请求上触发
- ❌ 在不相关主题上不触发

**测试套件示例：**

**应该触发：**
- "帮我设置一个新的 ProjectHub 工作区"
- "我需要在 ProjectHub 中创建一个项目"
- "为 Q4 规划初始化一个 ProjectHub 项目"

**不应该触发：**
- "旧金山的天气怎么样？"
- "帮我写 Python 代码"
- "创建电子表格"（除非 ProjectHub skill 处理电子表格）

**2. 功能测试**
- ✅ 生成有效输出
- ✅ API 调用成功
- ✅ 错误处理工作
- ✅ 覆盖边缘情况

**测试示例：**

```
测试：创建带有 5 个任务的项目

给定：项目名称 "Q4 Planning"，5 个任务描述

当：Skill 执行工作流

然后：
- 在 ProjectHub 中创建项目
- 创建 5 个带有正确属性的任务
- 所有任务链接到项目
- 无 API 错误
```

**3. 性能比较**

| 不使用 skill | 使用 skill |
|-------------|-----------|
| 用户每次提供指令 | 自动工作流执行 |
| 15 次往返消息 | 仅 2 次澄清问题 |
| 3 次 API 调用失败 | 0 次 API 调用失败 |
| 12,000 tokens 消耗 | 6,000 tokens 消耗 |

---

## 常见问题排除

### Skill 无法上传

**错误：** "Could not find SKILL.md in uploaded folder"

**原因：** 文件未命名为 SKILL.md

**解决方案：**
- 重命名为 SKILL.md（区分大小写）
- 验证：`ls -la` 应显示 SKILL.md

---

### Skill 不触发

**症状：** Skill 永不自动加载

**修复：**
修订您的 description 字段。

**快速检查：**
- 是否太笼统？（"帮助处理项目"不起作用）
- 是否包含用户实际会说的话？
- 如果适用，是否提及相关文件类型？

**调试方法：**
问 Claude："你什么时候会使用 [skill name] skill？" Claude 会引用描述。根据缺失内容调整。

---

### Skill 触发太频繁

**症状：** Skill 为不相关查询加载

**解决方案：**

**1. 添加负面触发词**

```yaml
description: CSV 文件的高级数据分析。用于统计建模、回归、聚类。
不要用于简单数据探索（改用 data-viz skill）。
```

**2. 更具体**

```yaml
# 太宽泛
description: 处理文档

# 更具体
description: 处理用于合同审查的 PDF 法律文档
```

**3. 澄清范围**

```yaml
description: 电商的 PayFlow 支付处理。
专门用于在线支付工作流，不用于一般财务查询。
```

---

## 快速开始检查清单

### 开始之前
- [ ] 确定 2-3 个具体用例
- [ ] 确定工具（内置或 MCP）
- [ ] 阅读本指南和示例技能
- [ ] 规划文件夹结构

### 开发期间
- [ ] 文件夹使用 kebab-case 命名
- [ ] SKILL.md 文件存在（精确拼写）
- [ ] YAML frontmatter 有 --- 分隔符
- [ ] name 字段：kebab-case，无空格，无大写
- [ ] description 包含 WHAT 和 WHEN
- [ ] 无任何地方的 XML 标签（< >）
- [ ] 指令清晰且可操作
- [ ] 包含错误处理
- [ ] 提供示例
- [ ] 引用清晰链接

### 上传之前
- [ ] 在明显任务上测试触发
- [ ] 在改写请求上测试触发
- [ ] 验证在不相关主题上不触发
- [ ] 功能测试通过
- [ ] 工具集成工作（如果适用）
- [ ] 压缩为 .zip 文件

### 上传之后
- [ ] 在真实对话中测试
- [ ] 监控触发不足/过度
- [ ] 收集用户反馈
- [ ] 迭代描述和指令
- [ ] 更新 metadata 中的版本

---

## 技能创建助手模式

当您需要创建新技能时，我可以帮助您：

1. **从自然语言描述生成技能**
   - 描述您的用例
   - 我将生成正确格式的 SKILL.md

2. **审查和改进现有技能**
   - 标记常见问题（模糊描述、缺少触发词、结构问题）
   - 识别潜在的触发不足/过度风险
   - 基于技能的既定目的建议测试用例

3. **迭代改进**
   - 使用您的技能时遇到边缘情况或失败
   - 将这些示例带回给我
   - 我将改进技能如何处理特定边缘情况

---

## 使用方法

**创建新技能：**
```
使用 skill-creator skill 帮我创建一个 [你的用例] 的技能
```

**审查技能：**
```
使用 skill-creator skill 审查这个技能并建议改进
```

**改进技能：**
```
使用此聊天中识别的问题和解决方案来改进技能如何处理 [特定边缘情况]
```

---

## 参考资源

- [Anthropic Skills Guide](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
- [Skills Documentation](https://docs.anthropic.com/)
- [Example Skills Repository](https://github.com/anthropics/skills)
