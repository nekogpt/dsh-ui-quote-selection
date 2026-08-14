# 发布清单

发布前确认：

- [x] `repository.url` = https://github.com/nekogpt/dsh-ui-quote-selection
- [x] `LICENSE` 版权行 = nekogpt and contributors
- [x] 官方 `dsh.bundle` + `cordis.patch.yml`
- [x] `npm run check`
- [x] `npm pack --dry-run`
- [ ] 在 dsh 当前版本上复测：选中 → chip → 发送展开 → 删除 chip

发布：

```sh
npm login --registry=https://registry.npmjs.org
npm publish --access public --registry=https://registry.npmjs.org
```

用户安装：

```sh
dsh plugin --profile web add dsh-ui-quote-selection
```

发布前自检命令：

```powershell
# 语法与 tarball 内容核对
npm run check
npm pack --dry-run

# 加载验证
dsh --profile web --dump-config | Select-String quote-selection
```
