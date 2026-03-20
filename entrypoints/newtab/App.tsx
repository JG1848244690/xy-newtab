import { useState } from 'react';
import { ShortcutGrid } from '@/src/components/ShortcutGrid';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 顶部搜索栏 */}
      <div className="flex justify-center pt-20 pb-10">
        <div className="w-full max-w-xl">
          <input
            type="text"
            placeholder="搜索..."
            className="w-full px-6 py-3 rounded-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* 快捷图标网格 */}
      <div className="flex justify-center px-8">
        <ShortcutGrid />
      </div>

      {/* 底部信息 */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
        自定义新标签页
      </div>
    </div>
  );
}

export default App;
