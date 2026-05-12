import { useMemo } from 'react'
import { Tag, Tooltip, Button } from '@lobehub/ui'
import { Download, Heart, Plus } from 'lucide-react'
import {
  getCardImageUrl,
  isExtraDeckCard,
} from '../../config/ygoCardUtils'

export function useCardLibraryTableColumns({
  favoriteSet,
  downloadCardImage,
  openAddToDeckModal,
  handleToggleFavorite,
}) {
  return useMemo(
    () => [
      {
        title: '卡图',
        key: 'thumb',
        width: 72,
        align: 'center',
        className: 'card-lib-col-thumb',
        render: (_, row) => (
          <img
            className="card-lib-thumb"
            src={getCardImageUrl(row)}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ),
      },
      {
        title: '卡牌名称',
        dataIndex: 'name',
        align: 'left',
        ellipsis: true,
        render: (t, row) => (
          <span className="card-lib-name-cell">
            {t}
            {isExtraDeckCard(row) ? (
              <Tag color="purple" style={{ marginLeft: 8 }}>
                额外
              </Tag>
            ) : null}
          </span>
        ),
      },
      {
        title: '类型',
        dataIndex: 'type',
        width: 168,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '属性 / 攻防',
        key: 'stat',
        width: 148,
        align: 'center',
        render: (_, row) => {
          if (/monster/i.test(row.type || '')) {
            return `${row.attribute || '-'} · ${row.atk ?? '?'} / ${row.def ?? '?'}`
          }
          return '—'
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 112,
        align: 'center',
        render: (_, row) => {
          const fav = favoriteSet.has(Number(row.id))
          return (
            <div className="card-lib-actions">
              <Tooltip title="下载卡图">
                <Button
                  type="text"
                  variant="outlined"
                  size="small"
                  icon={<Download size={16} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    void downloadCardImage(row)
                  }}
                />
              </Tooltip>
              <Tooltip title="加入卡组">
                <Button
                  type="text"
                  variant="outlined"
                  size="small"
                  icon={<Plus size={16} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    openAddToDeckModal(row)
                  }}
                />
              </Tooltip>
              <Tooltip title={fav ? '取消收藏' : '收藏'}>
                <Button
                  type="text"
                  variant="outlined"
                  size="small"
                  className={fav ? 'card-lib-fav-on' : ''}
                  icon={
                    <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
                  }
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleFavorite(row)
                  }}
                />
              </Tooltip>
            </div>
          )
        },
      },
    ],
    [
      favoriteSet,
      downloadCardImage,
      openAddToDeckModal,
      handleToggleFavorite,
    ],
  )
}
