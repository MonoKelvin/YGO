import { useCallback, useEffect, useRef, useState } from 'react'
import { Checkbox, ScrollArea, Button, Empty } from '@lobehub/ui'
import { Select } from '@lobehub/ui/base-ui'
import { SearchBar } from '../../lobe/primitives'
import { Loader2, Plus, RefreshCw } from 'lucide-react'

const LIBRARY_MODE_OPTIONS = [
  { value: 'online', label: '在线查询' },
  { value: 'local', label: '本地全库' },
]

export default function CardLibraryToolbarTable({
  libraryMode,
  missingDb = false,
  showListTable = true,
  onLibraryModeChange,
  onRefreshDatabase,
  searchInput,
  setSearchInput,
  typeOptions,
  attrOptions,
  filterType,
  filterAttr,
  setFilters,
  apiPage,
  apiPageSize,
  apiHasMore,
  loading,
  fetchOnlinePage,
  pageRows,
  filteredLocal,
  librarySelectedRowKeys,
  openAddToDeckModal,
  toast,
  columns,
  allPageSelected,
  somePageSelected,
  toggleSelectAllPage,
  toggleRowKey,
  goDetail,
  libraryPageSize,
  libraryLocalPage,
  localTotalPages,
  setLibraryLocalPage,
}) {
  const [tableHeaderShadow, setTableHeaderShadow] = useState(false)
  const tableViewportRef = useRef(null)

  const syncTableHeaderShadow = useCallback(() => {
    const el = tableViewportRef.current
    if (!el) return
    setTableHeaderShadow(el.scrollTop > 2)
  }, [])

  const bindTableViewport = useCallback(
    (node) => {
      if (tableViewportRef.current) {
        tableViewportRef.current.removeEventListener(
          'scroll',
          syncTableHeaderShadow,
        )
      }
      tableViewportRef.current = node
      if (node) {
        node.addEventListener('scroll', syncTableHeaderShadow, {
          passive: true,
        })
        syncTableHeaderShadow()
      } else {
        setTableHeaderShadow(false)
      }
    },
    [syncTableHeaderShadow],
  )

  useEffect(() => {
    syncTableHeaderShadow()
  }, [pageRows, loading, syncTableHeaderShadow])

  const listEmptyTitle =
    libraryMode === 'local' && missingDb
      ? '未找到本地全库 JSON'
      : libraryMode === 'local'
        ? '暂无匹配卡牌'
        : '暂无数据'

  const listEmptyDescription =
    libraryMode === 'local' && missingDb ? (
      <>
        点击工具栏「刷新」下载到用户目录，或在开发环境执行{' '}
        <code>npm run cards:fetch</code> 写入 <code>src/assets/cards/data/</code>{' '}
        后重新打包。
      </>
    ) : libraryMode === 'local' ? (
      '尝试调整搜索或筛选条件，或点击「刷新」更新本地数据。'
    ) : (
      '尝试调整搜索、类型或属性筛选，或翻页查看其他结果。'
    )

  const showEmptyState = !loading && !showListTable

  const handleBatchAdd = () => {
    const idSet = new Set(librarySelectedRowKeys)
    const source = libraryMode === 'online' ? pageRows : filteredLocal
    const picked = source.filter((c) => idSet.has(c.id))
    if (!picked.length) {
      toast.warning(
        libraryMode === 'online'
          ? '所选卡牌不在当前页（在线分页仅处理本页勾选）'
          : '所选卡牌不在当前筛选结果中，请重新勾选',
      )
      return
    }
    openAddToDeckModal(picked)
  }

  return (
    <div className="card-library-body card-library-body-full">
      <div className="card-library-main">
        <div className="card-library-toolbar card-library-toolbar--single">
          <div className="card-library-toolbar-left">
          <Select
            variant="outlined"
            className="card-library-mode-select"
            popupMatchSelectWidth={false}
            options={LIBRARY_MODE_OPTIONS}
            value={libraryMode}
            onChange={onLibraryModeChange}
          />
          <div className="card-library-search-grow">
            <SearchBar
              value={searchInput}
              onInputChange={setSearchInput}
              placeholder="搜索名称（在线：模糊匹配 fname）"
            />
          </div>
          <Select
            variant="outlined"
            allowClear
            placeholder="卡片类型"
            className="card-library-filter-select-type"
            popupMatchSelectWidth={false}
            options={typeOptions}
            value={filterType || undefined}
            onChange={(v) => setFilters({ filterType: v || '' })}
          />
          <Select
            variant="outlined"
            allowClear
            placeholder="怪兽属性"
            className="card-library-filter-select-attr"
            popupMatchSelectWidth={false}
            options={attrOptions}
            value={filterAttr || undefined}
            onChange={(v) => setFilters({ filterAttr: v || '' })}
          />
          <Button
            size="small"
            variant="outlined"
            className="card-library-toolbar-btn"
            icon={<RefreshCw size={14} />}
            onClick={onRefreshDatabase}
          >
            刷新
          </Button>
          </div>
          <div className="card-library-toolbar-pager">
            <span className="card-library-count card-library-count--inline">
              {libraryMode === 'online'
                ? `第 ${apiPage} 页 · 每页 ${apiPageSize} 张 · 本页 ${pageRows.length} 张`
                : `筛选 ${filteredLocal.length} 张`}
            </span>
            <div className="card-library-toolbar-buttons">
            <Button
              size="small"
              color="primary"
              variant="outlined"
              className="card-library-toolbar-btn"
              disabled={!librarySelectedRowKeys.length}
              icon={<Plus size={14} />}
              onClick={handleBatchAdd}
            >
              将所选加入卡组
            </Button>
            {libraryMode === 'online' ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  className="card-library-toolbar-btn"
                  disabled={apiPage <= 1 || loading}
                  onClick={() => void fetchOnlinePage(apiPage - 1)}
                >
                  上一页
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className="card-library-toolbar-btn"
                  disabled={!apiHasMore || loading}
                  onClick={() => void fetchOnlinePage(apiPage + 1)}
                >
                  下一页
                </Button>
              </>
            ) : null}
            </div>
          </div>
        </div>

        <div className="card-lib-table-area">
          <ScrollArea
            className={[
              'card-lib-table-scroll',
              loading ? 'card-lib-table-scroll--loading' : '',
              showEmptyState ? 'card-lib-table-scroll--empty' : '',
              tableHeaderShadow ? 'card-lib-table-scroll--header-shadow' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            contentProps={{ className: 'card-lib-table-scroll-content' }}
            viewportProps={{ ref: bindTableViewport }}
          >
            <div className="card-lib-table-scroll-inner">
              {loading ? (
                <div className="card-lib-loading-overlay" aria-busy="true">
                  <Loader2 className="ygo-spin" size={28} aria-hidden />
                </div>
              ) : null}
              {showEmptyState ? (
                <div className="card-lib-empty-wrap">
                  <Empty
                    align="center"
                    justify="center"
                    className="card-lib-empty"
                    imageSize={40}
                    title={listEmptyTitle}
                    description={listEmptyDescription}
                    titleProps={{
                      align: 'center',
                      fontSize: 'var(--font-size-md)',
                      weight: 500,
                    }}
                    descriptionProps={{
                      align: 'center',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>
              ) : (
              <table className="card-lib-table">
                <thead>
                  <tr>
                    <th className="card-lib-col-check">
                      <div className="card-lib-check-wrap">
                        <Checkbox
                          checked={allPageSelected}
                          indeterminate={!allPageSelected && somePageSelected}
                          onChange={() => toggleSelectAllPage()}
                        />
                      </div>
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.key || col.dataIndex}
                        style={{
                          width: col.width,
                          textAlign: col.align || 'left',
                        }}
                        className={col.className}
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="card-lib-row"
                      onDoubleClick={() => goDetail(row)}
                    >
                      <td
                        className="card-lib-col-check"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <div className="card-lib-check-wrap">
                          <Checkbox
                            checked={librarySelectedRowKeys.includes(row.id)}
                            onChange={(checked) => toggleRowKey(row.id, checked)}
                          />
                        </div>
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key || col.dataIndex}
                          style={{ textAlign: col.align || 'left' }}
                          className={col.className}
                        >
                          {col.render
                            ? col.render(
                                col.dataIndex != null
                                  ? row[col.dataIndex]
                                  : undefined,
                                row,
                              )
                            : row[col.dataIndex]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </ScrollArea>
          {showListTable &&
          libraryMode === 'local' &&
          filteredLocal.length > libraryPageSize ? (
            <div className="card-lib-local-pagination">
              <Button
                variant="outlined"
                disabled={libraryLocalPage <= 1 || loading}
                onClick={() =>
                  setLibraryLocalPage(Math.max(1, libraryLocalPage - 1))
                }
              >
                上一页
              </Button>
              <span className="card-lib-page-indicator">
                {libraryLocalPage} / {localTotalPages}
              </span>
              <Button
                variant="outlined"
                disabled={
                  libraryLocalPage >= localTotalPages || loading
                }
                onClick={() =>
                  setLibraryLocalPage(
                    Math.min(localTotalPages, libraryLocalPage + 1),
                  )
                }
              >
                下一页
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
