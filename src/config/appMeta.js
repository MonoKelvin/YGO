/** 应用展示用元数据（构建时注入版本号） */
export const APP_NAME = 'YGO'
export const APP_REPOSITORY_URL = 'https://github.com/MonoKelvin/YGO'
export const APP_TAGLINE = '游戏王卡牌工具'
export const APP_DESCRIPTION =
  '本地卡牌生成、浏览与数据库查询工具，素材与数据仅供学习与交流使用。本项目全部代码由AI赛博打工人生成，开发者负责监督和取餐。鼠鼠我呀，真的是一行代码都不想写了～ (￣ω￣)'

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

export const IS_DEV_BUILD = import.meta.env.DEV === true
