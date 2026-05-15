; 在 electron-builder 合并 NSIS 主脚本之前注入（早于 !include MUI2.nsh）。
; 扁平化浅色向导区 + 深色正文，与 prepare-nsis-installer-ui.mjs 生成的位图一致。

!define MUI_BGCOLOR F2F4F8
!define MUI_TEXTCOLOR 1A1B22

; 页眉/子标题（双值为一个宏参数时需引号，否则 !define 解析失败）
!define MUI_PAGE_HEADER_TEXT_COLOR 1A1B22
!define MUI_PAGE_HEADER_SUBTEXT_COLOR 6B6D78

; 安装进度列表：背景色 + 文字色（空格分隔，整体加引号）
!define MUI_INSTFILESPAGE_COLORS "F2F4F8 1A1B22"

; 完成页
!define MUI_FINISHPAGE_TITLE "安装完成"
!define MUI_FINISHPAGE_TEXT "「YGO」已安装到本计算机。可勾选下方选项立即启动应用。"

; 在 common.nsh 设置 BrandingText 之后执行，弱化左下角产品名+版本（更简约）
!macro customHeader
  BrandingText " "
!macroend
