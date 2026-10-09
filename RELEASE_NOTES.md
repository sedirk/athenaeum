*Athenaeum v0.6.4-zh.1 — English / 简体中文 community edition, based on upstream stable v0.6.4.*

## What's New / 更新内容

- 从双语版 0.5.6 升级至上游稳定版 0.6.4，保留英语与简体中文即时切换和语言记忆。
- 补充叠加流程、参数面板、预设、状态、输出设置及更新窗口的中文；部分高级说明和后台错误仍以英语显示。
- 包含上游 0.6 系列的叠加流程：主校准帧、科学帧校准、去马赛克、测量筛选、配准、局部归一化、叠加及 Drizzle。
- Updates the bilingual fork from 0.5.6 to upstream stable 0.6.4. English remains available under Settings → Display Language.
- Extends Chinese coverage to the stacking pipeline, parameter controls, presets, states, output settings and update dialog. Some advanced help and backend messages remain English.

## Changes / 更新方式

- 本社区版仅从 sedirk/athenaeum 的 GitHub Releases 检查双语版更新。下载 Windows x64 安装包后手动安装，不会自动安装上游原版覆盖汉化。
- This community build checks its own GitHub bilingual release channel. Install the Windows x64 download manually; upstream's signed auto-installer is intentionally not used by this fork.
- 源文件不会因安装而被移动或删除。跨版本升级前，建议备份 Athenaeum 的素材数据库；旧版本不保证可直接读取新版数据库。
- Updating the app does not move or delete source images. Back up the catalog before upgrading; older versions may not understand the upgraded database.

## Bug Fixes / 修复

- 保留原汉化版的历史导航、中文数字占位符与语言持久化修复。
- Preserves the previous bilingual edition's history navigation, placeholder interpolation and language persistence fixes.
- Includes upstream changes through tag v0.6.4. This is a community Windows trial build, not an official upstream release.

Upstream project and original author: [eg013ra1n/athenaeum](https://github.com/eg013ra1n/athenaeum).
Bilingual downloads: [sedirk/athenaeum Releases](https://github.com/sedirk/athenaeum/releases).
