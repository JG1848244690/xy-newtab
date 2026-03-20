import "~/src/assets/tailwind.css";

export default defineContentScript({
  matches: ["*://*.google.com/*"],  // 修改为目标网站
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("[Extension] Content script loaded");

    // 防止重复初始化
    if (window.__extensionInitialized) {
      return;
    }
    window.__extensionInitialized = true;

    // 示例：挂载一个简单的 UI
    const ui = await createShadowRootUi(ctx, {
      name: "my-extension-overlay",
      position: "inline",
      anchor: "body",
      append: "first",
      onMount: (container) => {
        // 在这里渲染 React 组件
        const div = document.createElement("div");
        div.textContent = "Extension loaded!";
        div.style.padding = "10px";
        div.style.background = "#4F46E5";
        div.style.color = "white";
        container.appendChild(div);
        return div;
      },
    });

    ui.mount();
  },
});
