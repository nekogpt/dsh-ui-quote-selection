# 发布清单

发布前逐项确认：

- [x] `repository.url` = https://github.com/nekogpt/dsh-ui-quote-selection
- [x] `LICENSE` 版权行 = nekogpt and contributors
- [ ] 在 dsh 当前版本上复测全链路：选中 → chip → 发送展开为完整原文 → 删除 chip
- [ ] 决定版本号（`npm version patch`）

发布：

```powershell
# npm 方式
npm publish --access public

# 或仅 GitHub（pnpm 支持 git 依赖）
git init && git add -A && git commit -m "init"
git remote add origin https://github.com/nekogpt/dsh-ui-quote-selection.git
git push -u origin main
```

对方安装（两种方式装的都是同一个包）：

```powershell
cd $env:DSH_HOME\profiles\web
pnpm add dsh-ui-quote-selection            # 或: pnpm add github:用户名/仓库名
# 然后在 cordis.patch.yml 追加:
#   - insert:
#       - id: ui-quote-selection
#         name: 'dsh-ui-quote-selection'
# 重启 dsh web
```

发布前自检命令：

```powershell
# tarball 内容核对（应恰好 5 个文件）
npm pack --dry-run

# 加载验证（无需重启）
dsh --profile web --dump-config | Select-String quote-selection

# 安装/卸载脚本沙箱测试
$env:DSH_HOME='D:\temp-dsh-quote-test'; .\install.ps1 -Source .; .\uninstall.ps1 -RemovePackage
```

```powershell
npm pack --dry-run   # 应包含: package.json / README.md / LICENSE / lib/index.js / lib/client.js
```