import { useState, useEffect } from 'react'
import { Button, Tooltip, toast } from '@lobehub/ui'
import { FolderInput, RotateCcw, AlertCircle } from 'lucide-react'
import { openConfirmModal } from '../../../utils/openConfirmModal'

/**
 * 存储设置区块
 * @param {Object} props
 * @param {boolean} props.hasElectron - 是否有 Electron API
 * @param {Function} props.onDataPathChange - 数据路径变更后的回调
 */
export default function StorageSection({ hasElectron, onDataPathChange }) {
  const [dataPathInfo, setDataPathInfo] = useState(null)
  const [dataPathBusy, setDataPathBusy] = useState(false)

  const electron = typeof window !== 'undefined' ? window.electronAPI : null

  useEffect(() => {
    const refreshDataPath = async () => {
      if (!electron?.getDataRootInfo) return
      try {
        const r = await electron.getDataRootInfo()
        setDataPathInfo(r)
      } catch (e) {
        console.error(e)
      }
    }
    void refreshDataPath()
  }, [electron])

  const handleOpenFolder = async () => {
    if (!dataPathInfo?.effectivePath || !electron?.openPathInExplorer) return
    const r = await electron.openPathInExplorer(dataPathInfo.effectivePath)
    if (!r.success) {
      toast.error({
        title: '无法打开目录',
        description: r.error || '未知错误',
      })
    }
  }

  const handlePickMigrate = () => {
    if (!electron?.pickDataDirectory || !electron?.applyDataDirectory) return
    void (async () => {
      const pick = await electron.pickDataDirectory()
      if (pick.canceled || !pick.success || !pick.path) return

      openConfirmModal({
        title: '迁移用户数据',
        width: 520,
        content: (
          <div className="settings-data-migrate-body">
            <p>将把当前用户数据完整复制到所选文件夹，并切换应用的数据目录到该路径。</p>
            <p className="settings-data-migrate-target">
              <span className="settings-data-migrate-label">目标：</span>
              <span className="settings-data-migrate-path">{pick.path}</span>
            </p>
          </div>
        ),
        okText: '开始迁移',
        cancelText: '取消',
        onOk: async () => {
          setDataPathBusy(true)
          try {
            const res = await electron.applyDataDirectory(pick.path)
            if (!res.success) {
              toast.error({
                title: '迁移失败',
                description: res.error || '未知错误',
              })
              return
            }
            if (res.unchanged) {
              toast.info('目录未变化')
              return
            }
            const r = await electron.getDataRootInfo()
            setDataPathInfo(r)
            onDataPathChange?.()
            toast.success('数据已迁移并切换到新目录')
          } finally {
            setDataPathBusy(false)
          }
        },
      })
    })()
  }

  const handleResetDefault = () => {
    if (!electron?.resetDataDirectoryDefault) return
    openConfirmModal({
      title: '恢复默认数据目录',
      width: 480,
      content: '将把当前用户数据复制回系统默认用户目录，并清除自定义路径。确定继续？',
      okText: '恢复默认',
      cancelText: '取消',
      onOk: async () => {
        setDataPathBusy(true)
        try {
          const res = await electron.resetDataDirectoryDefault()
          if (!res.success) {
            toast.error({
              title: '操作失败',
              description: res.error || '未知错误',
            })
            return
          }
          if (res.unchanged) {
            toast.info('已在默认目录')
          } else {
            toast.success('已恢复到默认用户数据目录')
          }
          const r = await electron.getDataRootInfo()
          setDataPathInfo(r)
          onDataPathChange?.()
        } finally {
          setDataPathBusy(false)
        }
      },
    })
  }

  const dataDirHint = '卡组、DIY 卡牌与本地卡库等均保存在此目录；更改后将自动迁移全部文件。'
  const effectivePath = dataPathInfo?.effectivePath || ''
  const showResetDefault = Boolean(dataPathInfo?.customRoot?.trim?.())

  const DataDirectoryLabel = () => (
    <div className="settings-data-label">
      <div className="settings-data-header">
        <span className="settings-data-title">用户数据目录</span>
        <Tooltip title={dataDirHint} placement="topLeft">
          <button
            type="button"
            className="settings-help-trigger"
            aria-label="关于用户数据目录"
          >
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
          </button>
        </Tooltip>
      </div>
      <button
        type="button"
        className="settings-data-path-link"
        title={effectivePath ? `在资源管理器中打开：${effectivePath}` : ''}
        onClick={() => void handleOpenFolder()}
        disabled={!effectivePath || dataPathBusy}
      >
        {effectivePath || '加载中…'}
      </button>
    </div>
  )

  const DataDirectoryControl = () => (
    <div className="settings-data-actions">
      <Button
        size="small"
        variant="outlined"
        icon={<FolderInput size={14} />}
        onClick={handlePickMigrate}
        disabled={dataPathBusy}
      >
        更改目录…
      </Button>
      {showResetDefault && (
        <Button
          size="small"
          variant="outlined"
          icon={<RotateCcw size={14} />}
          onClick={handleResetDefault}
          disabled={dataPathBusy}
        >
          恢复默认
        </Button>
      )}
    </div>
  )

  return [
    {
      label: <DataDirectoryLabel />,
      name: 'dataDirectory',
      children: <DataDirectoryControl />,
    },
  ]
}
