# 生活小助手 · APP 打包说明

更新时间：2026-08-14

## 1. 方案选择

本项目采用 **PWA（渐进式网页应用）** 封装，理由：

- 成本最低：现有代码就是纯 HTML/CSS/JS，不需要引入原生构建链。
- 体验接近原生：安装后以独立窗口全屏运行，可离线使用。
- 数据模型不变：localStorage、课程表、导入导出、主题设置全部沿用现有逻辑。
- 个人自用足够：手机“添加到主屏幕”即可，无需应用商店审核。

不选 Capacitor 的原因：需要安装 Android Studio / Xcode 和整套原生工具链，维护成本高。
不选 Tauri 的原因：Tauri 目前以桌面端为主，移动端支持还不够成熟。

如果以后确实要发布 APK / IPA，见文末“可选：Capacitor 打包路线”。

## 2. 已完成的 PWA 配置

| 项目 | 内容 |
|---|---|
| manifest | 应用名、图标（any + maskable）、`display: standalone`、主题色/背景色、快捷方式 |
| 图标 | `icons/` 下 192/512、maskable 192/512、Apple Touch 图标 |
| 启动屏 | Android 使用 manifest 背景色；iOS 使用 6 张 `apple-touch-startup-image` |
| 离线缓存 | `sw.js` 版本 `daily-hub-v16`，预缓存页面、样式、脚本、图标、启动图、猫图 |
| 状态栏/安全区 | `viewport-fit=cover`、`env(safe-area-inset-*)`、iOS 状态栏 meta |
| 返回键 | 模块栈 + history + `popstate`：先关弹层，再返回上一模块，栈空则退出 |

## 3. 手机安装步骤（同一 Wi-Fi）

1. 电脑上双击项目目录里的 `start-server.ps1`。
2. 终端会显示类似 `http://192.168.x.x:8770/` 的地址。
3. 手机连接同一个 Wi-Fi，用手机浏览器打开这个地址。
4. 按系统安装：

Android Chrome：

- 右上角菜单 → “添加到主屏幕” → 添加；
- 或地址栏底部的“安装应用”按钮。

iPhone Safari：

- 点底部“分享”按钮 → “添加到主屏幕” → 添加。

## 4. 验证全屏效果

- 安装后从主屏幕图标打开，应该没有浏览器地址栏和工具条。
- 顶部状态栏区域不会遮挡内容（安全区已适配）。
- 断网后重新打开仍能使用（数据保存在浏览器本地）。
- Android 桌面会显示独立图标；iPhone 打开时是独立全屏窗口。

## 5. 常见问题

- 手机打不开：确认手机和电脑在同一个 Wi-Fi；如仍不行，检查 Windows 防火墙是否放行 8770 端口。
- 数据不互通：PWA 数据存在各设备浏览器的 localStorage 里，换手机前请先“导出数据”备份。
- 更新后看到旧版：改动代码后必须把 `sw.js` 里的缓存版本号 +1（当前为 `daily-hub-v16`），再重新打开页面。

## 6. 一键启动命令

在项目目录 `daily-hub/` 下任选一种：

```powershell
.\start-server.ps1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

```bash
python -m http.server 8770 --bind 0.0.0.0
```

## 7. 可选：Capacitor 打包路线（以后要出 APK 时再用）

前置要求：Node.js 18+、Android Studio（Android）、Xcode + macOS（iOS）。

```bash
cd outputs/daily-hub
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "生活小助手" "com.example.dailyhub" --web-dir .
npx cap add android
npx cap sync
npx cap open android
```

在 Android Studio 中执行 Build → Build APK(s) 即可生成安装包。

注意：

- iOS 需要 macOS 和 Xcode：`npx cap add ios` 后再用 Xcode 打包。
- Capacitor 的 `webDir` 必须指向包含 `index.html` 的目录，本项目即 `daily-hub/` 本身。
- 打包前先导出一份数据备份，避免测试安装过程误清浏览器数据。
