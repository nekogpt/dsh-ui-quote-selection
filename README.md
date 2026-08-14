# dsh-ui-quote-selection

在 DSH Web 里像 Codex / Claude Code 一样「选中即引用」：选中聊天消息中的任意文本，一键放入输入框，发送时自动展开为完整原文。

> 输入框里是紧凑的引用 chip，模型收到的是完整原文——显示简洁、信息无损。

## 特性

- 🖱️ **选中即用**：消息内选中文本，选区上方浮现「引用到输入框」按钮；滚动时按钮跟随选区移动，选区滚出视野、按 Esc 或选区消失时才隐藏
- 🧩 **官方管线**：基于 DSH 输入机的 reference 机制（`@` 触发源 + 占位符 + 提交序列化），不接管输入状态、不 hack 渲染
- ✨ **输入框整洁**：引用以 chip 呈现（`❝ 前 20 字…`），左对齐显示开头，悬停看预览，Backspace 即删
- 📦 **发送无损**：提交时 chip 物化为完整原文；序列化失败会**阻塞发送**而不是静默降级
- 🌏 **语言自适应**：按钮文案随界面语言中英切换

## 快速开始

### 环境要求

- DeepSeek Harness（`dsh`）**0.1.0-rc.6**，Web profile（`dsh web`）

### 安装（一行命令）

```powershell
# 已发布到 GitHub 后（包与脚本都从仓库取）：
irm https://raw.githubusercontent.com/nekogpt/dsh-ui-quote-selection/main/install.ps1 | iex

# 或本地源码目录：
.\install.ps1 -Source .           # -Restart 可顺带重启 dsh web（项目根目录即包）
```

脚本完成三件事：安装包（`pnpm add`，或 `-Source` 指定目录时直接复制）→ 幂等写入 patch row → 提示重启。

### 卸载（一行命令）

```powershell
irm https://raw.githubusercontent.com/nekogpt/dsh-ui-quote-selection/main/uninstall.ps1 | iex
# 连同包目录一起移除：uninstall.ps1 后加 -RemovePackage
```

> 重启不可省略：新插件的 row 只在 `dsh web` 启动时进入浏览器 boot graph。

### 手动安装（备用）

```powershell
cd $env:DSH_HOME\profiles\web
pnpm add dsh-ui-quote-selection        # 或: pnpm add github:nekogpt/dsh-ui-quote-selection
```

编辑 `$env:DSH_HOME\profiles\web\cordis.patch.yml`，追加：

```yaml
- insert:
    - id: ui-quote-selection
      name: 'dsh-ui-quote-selection'
```

重启 `dsh web`，浏览器硬刷新（Ctrl+Shift+R）。卸载 = 删掉该 row，重启。

## 使用

1. 在任意消息（自己或助手）里拖选一段文字
2. 点击选区上方的「引用到输入框」
3. 输入框中出现 chip，光标自动落在其后，继续输入你的问题
4. 发送——模型收到的消息里，chip 已展开为完整原文

**为什么发送后直接展开、而不是折叠成引用块？** 与 Claude Code 一致：气泡所见即模型所得，零解析歧义。紧凑交给输入框（chip），诚实交给发送（全文）。

## 工作原理

```text
选中文本
  │ 点击悬浮按钮
  ▼
slash/input-insert-reference 事件（session 作用域）
  │ 草稿中写入一个 U+FFFC 占位符，mint 一条 occurrence（source/ref/label）
  ▼
输入框 chip —— 官方 decorations 管线渲染，本插件注入一条左对齐 CSS（只命中引用 chip）
  │ 用户发送
  ▼
sinkSerialized → 本插件 codec.serialize(ref) → 完整原文
  ▼
模型收到展开后的全文
```

要点：

- 插件向 `@` 输入管线注册引用源 `quote-selection`（`ctx.inputTriggers.registerSource`），提交序列化走它的 `codec`
- chip 的显示与删除都是输入机原生行为，本插件不持有任何输入状态
- 草稿持久化 / 剪贴板走 `codec.clipboardText`（原文），刷新页面后未发送的引用安全降级为纯文本

## 开发

```text
lib/index.js   node 半面：空插件（只为提供 Loader 入口）
lib/client.js  浏览器半面：window.__ModuleLoader__.load 包装的手写 bundle
```

- bundle 内只 `require("react")`（平台种子），无其他运行时依赖
- 改完 `lib/client.js` **无需重启 `dsh web`**：host 按磁盘 serve（`no-cache`），client-HMR 检测到 hash 变化会自动热更；未生效就硬刷新
- 类型声明（`.d.ts`）暂缺，欢迎 PR

## 兼容性

- 在 `@deepseek-ai/dsh` **0.1.0-rc.6** 上开发并真机验证
- 依赖的 DSH 内部契约（rc 阶段可能变化，升级 dsh 后请先复测「选中 → chip → 发送展开」全链路）：`/plugins` 客户端 bundle 服务、`ctx.inputTriggers` 引用管线、`slash/input-insert-reference` 会话事件、chip 的 decorations 渲染与 CSS 结构

## 发布

清单见 [PUBLISH.md](PUBLISH.md)。

## License

[MIT](LICENSE)
