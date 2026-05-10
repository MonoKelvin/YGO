import { useState } from 'react'
import { Layout, Menu } from 'antd'
import { Home, Search, Settings } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import TitleBar from './TitleBar'
import './Layout.css'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: Home, label: '卡牌生成' },
  { key: '/browse', icon: Search, label: '卡牌浏览' },
]

const bottomMenuItems = [
  { key: '/settings', icon: Settings, label: '设置' },
]

export default function LayoutComponent({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleToggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Layout className="app-layout">
      <TitleBar onToggleSidebar={handleToggleSidebar} collapsed={collapsed} />
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          className="app-sider"
        >
          <div className="app-logo">
            <span className="logo-text">YGO</span>
          </div>
          <div className="menu-container">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={handleMenuClick}
              items={menuItems.map(item => ({
                key: item.key,
                icon: <item.icon size={18} />,
                label: item.label,
              }))}
              className="main-menu"
            />
            <div className="bottom-menu">
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                onClick={handleMenuClick}
                items={bottomMenuItems.map(item => ({
                  key: item.key,
                  icon: <item.icon size={18} />,
                  label: item.label,
                }))}
                className="settings-menu"
              />
            </div>
          </div>
        </Sider>
        <Layout>
          <Content className="app-content">
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
