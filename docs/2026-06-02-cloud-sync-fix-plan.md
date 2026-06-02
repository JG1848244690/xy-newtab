# 云同步功能修复计划

日期：2026-06-02
对应提交：未提交工作区修改（基于 `2a8e3ed` 之后的新增云同步功能）
涉及文件：
- `entrypoints/background.ts`
- `entrypoints/popup/SessionTab.tsx`
- `messaging/index.ts`
- `src/utils/constants.ts`
- `src/utils/types.ts`
- `.claude/settings.local.json`

---

## 优先级 P0 — 数据正确性与稳定性

### 1. `splitStringByBytes` 重写为 O(n) 并保证 UTF-8 字符完整

**问题**：`entrypoints/background.ts:234-249`
- 当前实现是 O(n²)：每次循环重新 `encode(str.slice(start, i+1))`。
- `str.slice(start, i)` 按字符位置切分，未校验多字节 UTF-8 字符是否被截断（emoji、中文等都可能落到两个 chunk 边界）。

**方案**：
```typescript
// 方案 A：用 Blob 切片（推荐，简单可靠）
const splitStringByBytes = (str: string, limit: number): string[] => {
  const encoder = new TextEncoder();
  const fullBytes = encoder.encode(str);
  const decoder = new TextDecoder('utf-8');
  const chunks: string[] = [];
  let offset = 0;

  while (offset < fullBytes.length) {
    // 按字节切，但不能切碎多字节字符
    let end = Math.min(offset + limit, fullBytes.length);
    if (end < fullBytes.length) {
      // UTF-8 中首字节 0x80-0xBF 是续字节，0xC0+ 是字符首字节
      // 从 end 向后找到最近的字符边界
      while (end > offset && (fullBytes[end] & 0xC0) === 0x80) {
        end--;
      }
    }
    chunks.push(decoder.decode(fullBytes.subarray(offset, end), { stream: true }));
    offset = end;
  }
  // 收尾 flush
  if (chunks.length > 0) {
    chunks[chunks.length - 1] += decoder.decode();
  } else {
    chunks.push(str);
  }
  return chunks;
};
```

**验收**：
- 大数据（100KB+）同步不再卡顿
- 含 emoji / 中文的 JSON 切分后能正确解析
- 单元测试：构造包含多字节字符的字符串，验证 round-trip 还原后与原串一致

---

### 2. 下载前增加确认对话框

**问题**：`entrypoints/popup/SessionTab.tsx:113-133`
"从云端下载"按钮直接覆盖本地所有数据（快捷方式 + 分组 + 会话），无任何确认。

**方案**：
```typescript
const handleSyncDownload = async () => {
  // 先读取本地有多少数据
  const localCount = sessions.length;
  const message = localCount > 0
    ? `当前有 ${localCount} 个本地会话，确定要从云端下载并覆盖吗？\n\n该操作会清空本地所有快捷方式、分组和会话。`
    : '确定要从云端下载所有数据吗？';

  if (!window.confirm(message)) return;

  setSyncing('download');
  // ... 原有逻辑
};
```

**验收**：
- 有本地数据时弹出确认
- 取消则不发请求
- 本地为空时也提示一次（但可以简化文案）

---

### 3. 写入失败时保证数据一致性

**问题**：`entrypoints/background.ts:298-319`
`sync-upload` 流程：写 sessions → 写 main chunks → 写 meta → 清理孤儿。任何一步失败都会留下不一致状态。`try/catch` 也没有回滚。

**方案**：采用"快照 + 失败回滚"模式

```typescript
onMessage('tab-sessions/sync-upload', async (): Promise<SyncResult> => {
  const syncData = browser.storage.sync;

  // 0. 读取旧快照（用于回滚）
  const oldMeta = (await syncData.get(CLOUD_META_KEY))[CLOUD_META_KEY] as
    | { sessionIds: string[]; chunkCount: number }
    | undefined;
  const oldSessionKeys = (oldMeta?.sessionIds ?? []).map(
    id => `${SYNC_SESSION_PREFIX}${id}`,
  );
  const oldMainKeys = Array.from(
    { length: oldMeta?.chunkCount ?? 0 },
    (_, i) => `${CLOUD_DATA_PREFIX}main_${i}`,
  );
  const oldSnapshot = await syncData.get([...oldSessionKeys, ...oldMainKeys]);

  try {
    // ... 原有写入流程 ...
    return { success: true, ... };
  } catch (error) {
    // 回滚：把旧数据写回去
    console.error('[Background] Sync upload failed, rolling back:', error);
    try {
      // 先清掉所有新写入的 key（保守策略：用旧快照重写）
      await syncData.set(oldSnapshot);
    } catch (rollbackErr) {
      console.error('[Background] Rollback failed:', rollbackErr);
    }
    // ... 返回错误 ...
  }
});
```

**验收**：
- 模拟 `chrome.storage.sync.set` 失败，验证旧数据完整恢复
- 测试：写入过程中注入异常，确认 `meta` / `chunks` / `sessions` 都回到原状

---

### 4. 写入前检查总配额（100KB）

**问题**：代码只检查单条 8KB 限制，遗漏了 `chrome.storage.sync` **总配额 100KB**。错误处理也只识别 `QUOTA_BYTES_PER_ITEM`。

**方案**：
```typescript
// 在 storeChunks 之前预估
const mainJson = JSON.stringify(mainData);
const sessionsJson = JSON.stringify(
  sessions?.filter(s => s.tabs.length > 0) ?? []
);
const estimatedBytes =
  new TextEncoder().encode(mainJson).length +
  new TextEncoder().encode(sessionsJson).length +
  // 已占用的云端字节
  (await syncData.getBytesInUse()) +
  500; // 元数据开销

if (estimatedBytes > 100 * 1024) {
  return {
    success: false,
    error: `云端空间不足（预估 ${Math.round(estimatedBytes / 1024)}KB，限制 100KB）`,
  };
}
```

错误处理补全 `QUOTA_BYTES`（总配额）的识别：
```typescript
if (msg.includes('QUOTA_BYTES_PER_ITEM')) {
  return { success: false, error: '单条数据超过 8KB，请减少每个会话的标签数' };
}
if (msg.includes('QUOTA_BYTES')) {
  return { success: false, error: '云存储总空间不足（100KB 限制），请删除部分会话后再试' };
}
```

**验收**：
- 预占超过 100KB 时拒绝并返回明确错误
- 实际写入超限时，错误信息能区分"单条超限"和"总配额超限"

---

### 5. background 端并发同步锁

**问题**：`syncing` 状态只在 popup 局部。background 端没有防护，可能并发 upload + download 互相覆盖。

**方案**：
```typescript
// 放在 defineBackground 顶部
let isSyncing = false;
let syncLockError = '正在同步中，请稍后再试';

const withSyncLock = async <T>(fn: () => Promise<T>): Promise<T | SyncResult> => {
  if (isSyncing) {
    return { success: false, error: syncLockError };
  }
  isSyncing = true;
  try {
    return await fn();
  } finally {
    isSyncing = false;
  }
};

onMessage('tab-sessions/sync-upload', () => withSyncLock(doSyncUpload));
onMessage('tab-sessions/sync-download', () => withSyncLock(doSyncDownload));
```

**验收**：
- 同一时刻只能有一个 sync 操作在跑
- 第二个并发请求立即收到 `{ success: false, error: '正在同步中...' }`
- 操作完成后锁释放

---

## 优先级 P1 — 架构与一致性

### 6. 集中 `local:` 前缀，避免散落硬编码

**问题**：`entrypoints/background.ts:4-6` 和 `entrypoints/popup/SessionTab.tsx:10` 都重复定义：
```typescript
const LAST_SYNC_KEY = `local:${STORAGE_KEY.LAST_SYNC}` as const;
```
还有 `SHORTCUTS_KEY` / `GROUPS_KEY` / `TAB_SESSIONS_KEY` 都在 background 中拼接，未来其他文件用到时又会重复。

**方案**：在 `src/utils/constants.ts` 集中导出
```typescript
export const STORAGE_KEY = { /* 现有内容 */ } as const;

// 新增：local 命名空间下的完整 key
export const LOCAL_STORAGE_KEY = {
  SHORTCUTS: `local:${STORAGE_KEY.SHORTCUTS}`,
  GROUPS: `local:${STORAGE_KEY.GROUPS}`,
  TAB_SESSIONS: `local:${STORAGE_KEY.TAB_SESSIONS}`,
  LAST_SYNC: `local:${STORAGE_KEY.LAST_SYNC}`,
} as const;
```

然后 background 和 SessionTab 都改为：
```typescript
import { LOCAL_STORAGE_KEY } from '@/src/utils/constants';
const LAST_SYNC_KEY = LOCAL_STORAGE_KEY.LAST_SYNC;
```

**验收**：
- 全文搜索 `\`local:${STORAGE_KEY` 没有其他散落
- 符合 `no-hardcode.md` 规则的"集中管理"精神

---

### 7. download 端也做孤儿清理

**问题**：`cleanupOrphanSessions` 只在 upload 端。云端 session 只能通过下次 upload 触发清理，会持续占用配额。

**方案**：在 `sync-download` 后，根据 `meta.sessionIds` 清理云端其它以 `tabSession_` 开头的 key
```typescript
onMessage('tab-sessions/sync-download', async () => {
  // ... 现有下载逻辑 ...

  // 清理云端孤儿：列出所有 tabSession_ 开头的 key
  const allSync = await syncData.get(null); // 获取所有 key
  const allCloudSessionKeys = Object.keys(allSync)
    .filter(k => k.startsWith(SYNC_SESSION_PREFIX));
  const expectedKeys = new Set(
    meta.sessionIds.map(id => `${SYNC_SESSION_PREFIX}${id}`)
  );
  const orphanKeys = allCloudSessionKeys.filter(k => !expectedKeys.has(k));
  if (orphanKeys.length > 0) {
    await syncData.remove(orphanKeys);
  }
  // ...
});
```

注意：`chrome.storage.sync.get(null)` 可以获取所有条目，但需要权限。`@wxt-dev/storage` 包装后可能行为不同，需要实测。

**验收**：
- A 设备删除 session 并 upload → B 设备 download 后，云端孤儿被清理
- 不会误删本次 download 涉及的 session

---

### 8. 多设备冲突检测（基础版）

**问题**：A 16:00 upload、B 16:01 upload 会直接覆盖，本地有云端未知的新数据时也会被无声覆盖。

**方案（轻量版）**：上传前对比 `LAST_SYNC` 和云端 `meta.updatedAt`
```typescript
onMessage('tab-sessions/sync-upload', async () => {
  // 读取本地最后同步时间
  const localLastSync = await storage.getItem<number>(LAST_SYNC_KEY);
  // 读取云端 meta
  const cloudMeta = (await syncData.get(CLOUD_META_KEY))[CLOUD_META_KEY] as
    | { updatedAt: number }
    | undefined;

  if (cloudMeta && localLastSync && cloudMeta.updatedAt > localLastSync) {
    // 云端比本地新 → 有冲突
    return {
      success: false,
      error: '云端数据比本地新，请先下载再上传（避免覆盖其他设备的更新）',
    };
  }
  // ... 继续上传
});
```

**验收**：
- 模拟本地 LAST_SYNC=100, 云端 updatedAt=200, 第二次上传时拒绝
- 提供明确指引（先 download 再 upload）

---

## 优先级 P2 — 代码卫生与小优化

### 9. 提取 `getRelativeTime` 到公共工具

**问题**：`SessionTab.tsx:74-84` 的 `getRelativeTime` 是个通用函数，未来 background 或其他组件也要显示时间。

**方案**：新建 `src/utils/format.ts`
```typescript
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}-${date.getDate()}`;
};
```

**验收**：
- 多个组件共用同一实现
- 单测覆盖各时间区间

---

### 10. 修正 `SyncResult.count` 语义不一致

**问题**：upload 时 `count` = 实际上传数，download 时 `count` = 写入本地数。

**方案**：拆为两个字段或用注释说明
```typescript
export interface SyncResult {
  success: boolean;
  error?: string;
  lastSyncAt?: number;
  /** 上传时 = 实际上传的 session 数；下载时 = 写入本地的 session 数 */
  count?: number;
}
```

或者更清晰：
```typescript
export interface SyncResult {
  success: boolean;
  error?: string;
  lastSyncAt?: number;
  uploadedCount?: number;  // 仅 upload 使用
  restoredCount?: number;  // 仅 download 使用
}
```

**验收**：
- UI 端文案对应清楚（"已上传 N 个" / "已恢复 N 个"）
- 字段语义不再歧义

---

### 11. 清理冗余代码

| 位置 | 问题 | 修复 |
|------|------|------|
| `background.ts:255` | `if (totalBytes === 0) return 0;` 对 `JSON.stringify(obj)` 永真 | 删除该判断，或在调用方判空 |
| `background.ts:312` | `{ ...truncated, tabCount: truncated.tabs.length }` 中 truncated 已含 tabCount | 直接 `await syncData.set({ [\`${SYNC_SESSION_PREFIX}${truncated.id}\`]: truncated })` |
| `background.ts:3` | `import type { SyncResult }` 但 handler 内部未显式标注 | 在 `onMessage` 回调签名中加 `: Promise<SyncResult>` 标注 |
| `.claude/settings.local.json` | `Select-String -Pattern "error\|Error\|TS[0-9]"` 模式 `\|` 行为可疑 | 确认意图：若要匹配 TS 错误码应为 `TS[0-9]+`；若只想匹配 1 位数字的 `TSx` 则 OK |

---

## 执行阶段建议

```
阶段 1（安全重构，无行为变化）:
  6 → 9 → 10 → 11
  集中 storage key、提取 getRelativeTime、清理冗余

阶段 2（修 bug，无破坏性 API 变化）:
  1 → 4 → 5
  切分算法 + 配额检查 + 并发锁
  （这部分是 background 内部优化，popup 不感知）

阶段 3（用户体验）:
  2 → 7 → 8
  下载确认 + 孤儿清理 + 冲突检测
  （这些是新增的失败分支，需要更新 popup 文案）

阶段 4（数据完整性）:
  3
  写入回滚（最后一个做，因为需要重写 sync-upload 流程）
```

**总工作量估算**：
- 阶段 1：~1 小时
- 阶段 2：~2 小时（含单测）
- 阶段 3：~1.5 小时
- 阶段 4：~2 小时（含快照+回滚的单测）

**测试建议**：
- 单元测试：`splitStringByBytes` 各种边界、并发锁、错误识别
- E2E：upload → download 完整流程、冲突场景、配额超限场景
- 手动：多设备模拟（用不同 chrome profile 登录同一 Google 账号）
