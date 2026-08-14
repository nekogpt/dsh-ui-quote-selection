# DSH 划词引用

在 DSH Web 的聊天里选中一段文字，点击「引用到输入框」，就能针对这段话继续提问，不用来回复制粘贴。

输入框只显示一小段引用预览，发送时模型仍会收到完整原文。

## 安装

适用于 DeepSeek Harness Web。当前已在 `@deepseek-ai/dsh` `0.1.0-rc.6` 上测试。

```sh
dsh plugin --profile web add dsh-ui-quote-selection
```

安装后重启 `dsh web`，再刷新浏览器。如果没有立即生效，可以按 Ctrl+Shift+R 强制刷新。

## 使用

1. 在用户或助手的消息中选中一段文字。
2. 点击选区旁边的「引用到输入框」。
3. 继续输入你想问的问题。
4. 发送消息。

输入框中的引用标签只显示原文开头，鼠标移上去可以查看引用内容，按退格键即可删除。你也可以在一条消息里加入多段引用。

## 它做了什么

- 选中聊天文字后，一键放进输入框。
- 输入框只显示简短预览，不会被长段原文占满。
- 发送时自动带上完整原文，不会丢失内容。
- 按钮文字会跟随 DSH 界面语言显示中文或英文。

插件使用 DSH 自带的引用功能，不会修改 DSH 核心代码。

## 卸载

```sh
dsh plugin --profile web remove dsh-ui-quote-selection
```

卸载后重启 `dsh web`。

## 从源码安装

```sh
git clone https://github.com/nekogpt/dsh-ui-quote-selection.git
cd dsh-ui-quote-selection
dsh plugin --profile web add .
```

主要实现位于 `lib/client.js`。DSH 仍处于快速开发阶段；升级 DSH 后，如果引用功能出现异常，请提交 [Issue](https://github.com/nekogpt/dsh-ui-quote-selection/issues)。

## License

[MIT](LICENSE)
