// 自动生成的消息处理器初始化 (wxt-message-generator)
// import { initMessageHandlers } from '@/.wxt/backgroundMessages';

export default defineBackground(() => {
  console.log('[Extension] Background script loaded', { id: browser.runtime.id });

  // 初始化消息处理器 (如果有消息处理器)
  // initMessageHandlers();
});
