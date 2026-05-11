import { useState, useEffect, useCallback } from 'react'
import { Button, Tooltip, toast } from '@lobehub/ui'
import { AlertCircle, FolderInput, RotateCcw } from 'lucide-react'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import { openConfirmModal } from '../../utils/openConfirmModal'

/**
 * 用户数据根目录：展示路径、在资源管理器中打开、迁移到其他文件夹、恢复默认。
 */
export default function DataDirectorySection({ electron, embedInPanel = false }) {
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!electron?.getDataRootInfo) return
    try {
      const r = await electron.getDataRootInfo()
      setInfo(r)
    } catch (e) {
      console.error(e)
    }
  }, [electron])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const reloadStoresAfterRootChange = async () => {
    await useYgoDatabaseStore.getState().loadLocalDatabase()
    await useYgoDatabaseStore.getState().loadDecks()
  }

  const handleOpenFolder = async () => {
    if (!info?.effectivePath || !electron?.openPathInExplorer) return
    const r = await electron.openPathInExplorer(info.effectivePath)
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
            <p>
              将把当前用户数据完整复制到所选文件夹，并切换应用的数据目录到该路径。
            </p>
            <p className="settings-data-migrate-target">
              <span className="settings-data-migrate-label">目标：</span>
              <span className="settings-data-migrate-path">{pick.path}</span>
            </p>
          </div>
        ),
        okText: '开始迁移',
        cancelText: '取消',
        onOk: async () => {
          setBusy(true)
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
            await refresh()
            await reloadStoresAfterRootChange()
            toast.success('数据已迁移并切换到新目录')
          } finally {
            setBusy(false)
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
      content:
        '将把当前用户数据复制回系统默认用户目录，并清除自定义路径（引导文件仍保留在应用默认目录）。确定继续？',
      okText: '恢复默认',
      cancelText: '取消',
      onOk: async () => {
        setBusy(true)
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
          await refresh()
          await reloadStoresAfterRootChange()
        } finally {
          setBusy(false)
        }
      },
    })
  }

  if (!electron?.getDataRootInfo) {
    return null
  }

  const effective = info?.effectivePath || ''
  const showResetDefault = Boolean(info?.customRoot?.trim?.())

  const dataDirHint =
    '卡组、DIY 卡牌与本地卡库等均保存在此目录；更改后将自动迁移全部文件。'

  const panelBody = (
    <div className="settings-data-block">
      <div className="settings-item settings-data-head-row">
        <div className="settings-label-with-help">
          <label className="settings-label" htmlFor="settings-data-path-trigger">
            用户数据目录
          </label>
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
        <div className="settings-data-actions">
          <Button
            size="small"
            icon={<FolderInput size={14} />}
            onClick={handlePickMigrate}
            disabled={busy}
          >
            更改目录…
          </Button>
          {showResetDefault && (
            <Button
              size="small"
              icon={<RotateCcw size={14} />}
              onClick={handleResetDefault}
              disabled={busy}
            >
              恢复默认
            </Button>
          )}
        </div>
      </div>
      <div className="settings-data-path-row">
        <button
          id="settings-data-path-trigger"
          type="button"
          className="settings-data-path-link"
          title={effective ? `在资源管理器中打开：${effective}` : ''}
          onClick={() => void handleOpenFolder()}
          disabled={!effective || busy}
        >
          {effective || '加载中…'}
        </button>
      </div>
    </div>
  )

  if (embedInPanel) {
    return panelBody
  }

  return (
    <div className="settings-section">
      <h2 className="section-title">存储与数据</h2>
      {panelBody}
    </div>
  )
}
