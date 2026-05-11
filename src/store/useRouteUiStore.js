import { create } from 'zustand'

/**
 * 路由级 UI 状态（列表分页、多选等），切换页面后保留。
 */
export const useRouteUiStore = create((set) => ({
  /** 卡牌数据库 · 本地分页 */
  libraryLocalPage: 1,
  setLibraryLocalPage: (p) => set({ libraryLocalPage: p }),

  /** 卡牌数据库 · 表格多选 id */
  librarySelectedRowKeys: [],
  setLibrarySelectedRowKeys: (keys) =>
    set({
      librarySelectedRowKeys: Array.isArray(keys) ? keys : [],
    }),
}))

export default useRouteUiStore
