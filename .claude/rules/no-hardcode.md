# 禁止硬编码

所有可复用或可配置的值必须集中管理，不得在代码中硬编码。

## 常量存放位置

| 类型 | 存放位置 | 示例 |
|------|----------|------|
| Storage Keys | `src/utils/compareStorage.ts` | `STORAGE_KEY` |
| 常量 (URL、配置值等) | `src/utils/constants.ts` | `PC_BASE_URL` |
| DOM Selectors | `src/content/types.ts` 或各处理器文件顶部 | `MORE_BUTTON_SELECTOR` |
| 事件名称 | `src/content/types.ts` | `TIKTOK_ITEM_LIST_EVENT` |
| 消息类型 | `messaging/index.ts` | ProtocolMap 中的 key |

## 正确示例

```typescript
// ✅ 从常量文件导入
import { STORAGE_KEY } from "@/src/utils/compareStorage";
import { PC_BASE_URL } from "@/src/utils/constants";

const result = await browser.storage.local.get(STORAGE_KEY);
const url = PC_BASE_URL;
```

## 错误示例

```typescript
// ❌ 硬编码字符串
const result = await browser.storage.local.get("compareCreators");
const url = "https://engagementratecalculator.net";
```

## 添加新常量的步骤

1. 确定常量类型，选择对应的存放文件
2. 在文件中导出常量：

```typescript
// src/utils/constants.ts
export const MY_NEW_CONSTANT = "some-value";
```

3. 在使用处导入：

```typescript
import { MY_NEW_CONSTANT } from "@/src/utils/constants";
```
