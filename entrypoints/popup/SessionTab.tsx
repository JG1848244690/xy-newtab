import { useState, useEffect } from 'react';
import { Save, RotateCcw, Trash2, History, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { sendMessage } from '@/messaging';
import type { TabSession } from '@/src/utils/types';

function SessionTab() {
  const [sessions, setSessions] = useState<TabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const list = await sendMessage('tab-sessions/list', undefined);
      setSessions(list);
    } catch (err) {
      console.error('[SessionTab] Failed to load sessions:', err);
      setError('加载会话失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 保存当前标签页
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await sendMessage('tab-sessions/save', undefined);
      if (result.success && result.session) {
        // 重新加载列表
        await loadSessions();
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      console.error('[SessionTab] Failed to save session:', err);
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 恢复会话
  const handleRestore = async (sessionId: string) => {
    setRestoringId(sessionId);
    setError(null);
    try {
      const result = await sendMessage('tab-sessions/restore', sessionId);
      if (!result.success) {
        setError(result.error || '恢复失败');
      }
    } catch (err) {
      console.error('[SessionTab] Failed to restore session:', err);
      setError('恢复失败');
    } finally {
      setRestoringId(null);
    }
  };

  // 删除会话
  const handleDelete = async (sessionId: string) => {
    setError(null);
    try {
      const result = await sendMessage('tab-sessions/delete', sessionId);
      if (result.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        setError(result.error || '删除失败');
      }
    } catch (err) {
      console.error('[SessionTab] Failed to delete session:', err);
      setError('删除失败');
    }
  };

  // 计算相对时间
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  return (
    <div className="p-3 space-y-3">
      {/* 保存按钮 */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            保存当前标签页
          </>
        )}
      </Button>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 rounded-lg p-2">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </div>
      )}

      {/* 会话列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          加载中...
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <History className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">暂无保存的会话</p>
          <p className="text-xs mt-1 opacity-60">点击上方按钮保存当前标签页</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-white/20 dark:border-black/10 rounded-lg p-3 space-y-2 hover:bg-accent/30 transition-colors"
            >
              {/* 会话头信息 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {session.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{getRelativeTime(session.createdAt)}</span>
                    <span>·</span>
                    <span>{session.tabCount} 个标签页</span>
                    {session.tabCount >= 30 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-500" title="已达到 30 个标签页上限">上限</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 标签页预览 */}
              {session.tabs.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-0.5 max-h-[72px] overflow-hidden">
                  {session.tabs.slice(0, 3).map((tab, index) => (
                    <div key={index} className="truncate flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span>{tab.title || tab.url}</span>
                    </div>
                  ))}
                  {session.tabs.length > 3 && (
                    <div className="text-[10px] opacity-60">
                      还有 {session.tabs.length - 3} 个标签页...
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRestore(session.id)}
                  disabled={restoringId === session.id}
                  className="flex-1 gap-1.5 h-8 text-xs"
                >
                  {restoringId === session.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      恢复中...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      恢复
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(session.id)}
                  className="gap-1.5 h-8 text-xs text-red-500 hover:text-red-600 border-red-500/30 hover:border-red-500/50"
                >
                  <Trash2 className="w-3 h-3" />
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionTab;
