import { useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { STYLE } from '@/src/utils/constants';

function App() {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'settings'>('shortcuts');

  const openNewTab = () => {
    browser.tabs.create({});
  };

  return (
    <div className="w-80 min-h-100 bg-gray-900 text-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">快捷标签</h1>
        <button
          onClick={openNewTab}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="打开新标签页"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={cn(
            'flex-1 py-2 text-sm transition-colors',
            activeTab === 'shortcuts' ? STYLE.TAB_ACTIVE : STYLE.TAB_INACTIVE
          )}
        >
          快捷方式
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex-1 py-2 text-sm transition-colors',
            activeTab === 'settings' ? STYLE.TAB_ACTIVE : STYLE.TAB_INACTIVE
          )}
        >
          设置
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-4">
        {activeTab === 'shortcuts' && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm mb-4">
              在新标签页管理你的快捷方式
            </p>
            <button
              onClick={openNewTab}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              打开新标签页
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">背景主题</span>
              <select className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600">
                <option>深色渐变</option>
                <option>纯色</option>
                <option>自定义</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">每行图标数</span>
              <input
                type="number"
                defaultValue={8}
                min={4}
                max={12}
                className="w-16 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 text-center"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
