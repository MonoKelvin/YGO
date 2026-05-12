import { Checkbox, Flexbox, ScrollArea, Button, SearchBar } from '@lobehub/ui'
import { Select } from '@lobehub/ui/base-ui'
import { Loader2, Plus } from 'lucide-react'

export default function CardLibraryToolbarTable({
  libraryMode,
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
  return (
    <div className="card-library-body card-library-body-full">
      <div className="card-library-main">
        <div className="card-library-toolbar">
          <div className="card-library-toolbar-filters">
            <div className="card-library-search-grow">
              <SearchBar
                variant="outlined"
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
          </div>
          {libraryMode === 'online' && (
            <div className="card-library-pager-bar">
              <span className="card-library-count">
                第 {apiPage} 页 · 每页 {apiPageSize} 张 · 本页{' '}
                {pageRows.length} 张
              </span>
              <Flexbox horizontal gap={8} align="center">
                <Button
                  color="primary"
                  variant="outlined"
                  disabled={!librarySelectedRowKeys.length}
                  icon={<Plus size={16} />}
                  onClick={() => {
                    const idSet = new Set(librarySelectedRowKeys)
                    const picked = pageRows.filter((c) => idSet.has(c.id))
                    if (!picked.length) {
                      toast.warning(
                        '所选卡牌不在当前页（在线分页仅处理本页勾选）',
                      )
                      return
                    }
                    openAddToDeckModal(picked)
                  }}
                >
                  将所选加入卡组
                </Button>
                <Button variant="outlined" disabled={apiPage <= 1 || loading} onClick={() => void fetchOnlinePage(apiPage - 1)}>
                  上一页
                </Button>
                <Button variant="outlined" disabled={!apiHasMore || loading} onClick={() => void fetchOnlinePage(apiPage + 1)}>
                  下一页
                </Button>
              </Flexbox>
            </div>
          )}
          {libraryMode === 'local' && (
            <div className="card-library-pager-bar card-library-pager-bar-local">
              <span className="card-library-count">
                筛选 {filteredLocal.length} 张
              </span>
              <Flexbox horizontal gap={8} align="center">
                <Button
                  color="primary"
                  variant="outlined"
                  disabled={!librarySelectedRowKeys.length}
                  icon={<Plus size={16} />}
                  onClick={() => {
                    const idSet = new Set(librarySelectedRowKeys)
                    const picked = filteredLocal.filter((c) =>
                      idSet.has(c.id),
                    )
                    if (!picked.length) {
                      toast.warning(
                        '所选卡牌不在当前筛选结果中，请重新勾选',
                      )
                      return
                    }
                    openAddToDeckModal(picked)
                  }}
                >
                  将所选加入卡组
                </Button>
              </Flexbox>
            </div>
          )}
        </div>

        <div className="card-lib-table-area">
          <ScrollArea
            className={`card-lib-table-scroll${loading ? ' card-lib-table-scroll--loading' : ''}`}
            contentProps={{ className: 'card-lib-table-scroll-content' }}
          >
            <div className="card-lib-table-scroll-inner">
              {loading ? (
                <div className="card-lib-loading-overlay" aria-busy="true">
                  <Loader2 className="ygo-spin" size={28} aria-hidden />
                </div>
              ) : null}
              <table className="card-lib-table">
              <thead>
                <tr>
                  <th className="card-lib-col-check">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={
                        !allPageSelected && somePageSelected
                      }
                      onChange={() => toggleSelectAllPage()}
                    />
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
                      <Checkbox
                        checked={librarySelectedRowKeys.includes(row.id)}
                        onChange={(checked) =>
                          toggleRowKey(row.id, checked)
                        }
                      />
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
            </div>
          </ScrollArea>
          {libraryMode === 'local' &&
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
