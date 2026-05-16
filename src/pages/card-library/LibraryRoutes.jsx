import { Outlet, Route, Routes } from 'react-router-dom'
import CardLibrary from './CardLibrary'
import CardDetail from './CardDetail'
import './LibraryRoutes.css'

function LibraryRouteShell() {
  return (
    <div className="library-routes-shell">
      <Outlet />
    </div>
  )
}

/** 卡牌数据库子路由：列表与详情（供 PageCache 内匹配 /library/*） */
export default function LibraryRoutes() {
  return (
    <Routes>
      <Route element={<LibraryRouteShell />}>
        <Route path="/library/card/:id" element={<CardDetail />} />
        <Route path="/library" element={<CardLibrary />} />
      </Route>
    </Routes>
  )
}
