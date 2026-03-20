import { defineExtensionMessaging } from '@webext-core/messaging';

// 定义消息协议：函数签名 = 参数类型 => 返回值类型
interface ProtocolMap {
  // 示例消息
  'example/hello': (name: string) => string;
  // 'video/get-data': (data: { videoId: string }) => VideoData | null;
}

// 创建 messenger
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
