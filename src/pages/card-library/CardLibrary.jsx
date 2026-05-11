import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  useTransition,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Segmented, toast } from '@lobehub/ui'
import CardLibraryAddToDeckModal from '../../components/card-library/CardLibraryAddToDeckModal'
import CardLibraryToolbarTable from '../../components/card-library/CardLibraryToolbarTable'
import { Library, RefreshCw } from 'lucide-react'
import useYgoDatabaseStore from '../../store/useYgoDatabaseStore'
import useRouteUiStore from '../../store/useRouteUiStore'
import useCardStore from '../../store/useStore'
import { persistUserSettingsToDisk } from '../../utils/persistUserSettings'
import { getCardSortKey } from '../../config/ygoCardUtils'
import {
  YGO_TYPE_FILTERS,
  YGO_ATTRIBUTE_FILTERS,
} from '../../config/ygoprodeckFilters'
import { ensureYgoCardCached } from '../../services/ygoCardCacheClient'
import {
  downloadCardImage,
  sortDecksForAddPicker,
} from './cardLibraryHelpers'
import { useCardLibraryTableColumns } from './useCardLibraryTableColumns'
import './CardLibrary.css'

export default function CardLibrary() {
  const navigate = useNavigate()
  const libraryPageSize = useCardStore(
    (s) => s.settings.libraryPageSize ?? 20,
  )
  const favoriteCardIds = useCardStore(
    (s) => s.settings.favoriteCardIds || [],
  )
  const toggleFavoriteCardId = useCardStore((s) => s.toggleFavoriteCardId)

  const {
    libraryMode,
    setLibraryMode,
    cards,
    meta,
    summary,
    loading,
    error,
    missingDb,
    dbSource,
    filterSearch,
    filterType,
    filterAttr,
    apiPage,
    apiPageSize,
    apiHasMore,
    apiError,
    setFilters,
    fetchOnlinePage,
    loadLocalDatabase,
    addCardToDeck,
    addCardsToDeck,
    decks,
    lastAddTargetDeckId,
    lastActiveDeckId,
  } = useYgoDatabaseStore()

  const libraryLocalPage = useRouteUiStore((s) => s.libraryLocalPage)
  const setLibraryLocalPage = useRouteUiStore((s) => s.setLibraryLocalPage)
  const librarySelectedRowKeys = useRouteUiStore((s) => s.librarySelectedRowKeys)
  const setLibrarySelectedRowKeys = useRouteUiStore(
    (s) => s.setLibrarySelectedRowKeys,
  )

  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef(null)
  const [, startModeTransition] = useTransition()

  const favoriteSet = useMemo(
    () => new Set(favoriteCardIds),
    [favoriteCardIds],
  )

  useEffect(() => {
    useYgoDatabaseStore.getState().loadDecks()
  }, [])

  useEffect(() => {
    if (useYgoDatabaseStore.getState().apiPageSize === libraryPageSize) {
      return
    }
    setFilters({ apiPageSize: libraryPageSize })
    if (libraryMode === 'online') {
      void useYgoDatabaseStore.getState().fetchOnlinePage(1)
    }
  }, [libraryPageSize, setFilters, libraryMode])

  useEffect(() => {
    if (libraryMode !== 'local') return
    setFilters({ filterSearch: searchInput })
  }, [searchInput, libraryMode, setFilters])

  useEffect(() => {
    if (libraryMode !== 'online') return
    void fetchOnlinePage(1)
  }, [filterType, filterAttr, libraryMode, fetchOnlinePage])

  useEffect(() => {
    if (libraryMode !== 'online') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const prev = useYgoDatabaseStore.getState().filterSearch
      if (searchInput === prev) return
      setFilters({ filterSearch: searchInput })
      void useYgoDatabaseStore.getState().fetchOnlinePage(1)
    }, 450)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput, libraryMode, setFilters])

  useEffect(() => {
    if (libraryMode !== 'local') return
    void loadLocalDatabase()
  }, [libraryMode, loadLocalDatabase])

  useEffect(() => {
    setSearchInput(useYgoDatabaseStore.getState().filterSearch || '')
  }, [libraryMode])

  const filteredLocal = useMemo(() => {
    if (libraryMode !== 'online') {
      let list = cards
      const q = filterSearch.trim().toLowerCase()
      if (q) {
        list = list.filter(
          (c) =>
            String(c.name || '')
              .toLowerCase()
              .includes(q) ||
            String(c.archetype || '')
              .toLowerCase()
              .includes(q),
        )
      }
      if (filterType) list = list.filter((c) => c.type === filterType)
      if (filterAttr) list = list.filter((c) => c.attribute === filterAttr)
      return [...list].sort((a, b) => {
        const ka = getCardSortKey(a)
        const kb = getCardSortKey(b)
        if (ka !== kb) return ka - kb
        return String(a.name).localeCompare(String(b.name))
      })
    }
    return cards
  }, [libraryMode, cards, filterSearch, filterType, filterAttr])

  useEffect(() => {
    setLibraryLocalPage(1)
  }, [filterSearch, filterType, filterAttr, cards.length, libraryMode, setLibraryLocalPage])

  const pageRows = useMemo(() => {
    if (libraryMode === 'online') return cards
    const start = (libraryLocalPage - 1) * libraryPageSize
    return filteredLocal.slice(start, start + libraryPageSize)
  }, [libraryMode, cards, filteredLocal, libraryLocalPage, libraryPageSize])

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalCards, setAddModalCards] = useState([])
  const [pickDeckId, setPickDeckId] = useState(null)

  const decksForPicker = useMemo(
    () => sortDecksForAddPicker(decks, lastAddTargetDeckId),
    [decks, lastAddTargetDeckId],
  )

  const openAddToDeckModal = useCallback(
    (cardOrList) => {
      const list = Array.isArray(cardOrList) ? cardOrList : [cardOrList]
      if (!list.length) return
      if (!decks.length) {
        toast.warning('请先在「我的卡组」中创建一个卡组')
        return
      }
      setAddModalCards(list)
      const sorted = sortDecksForAddPicker(decks, lastAddTargetDeckId)
      const preferred =
        lastAddTargetDeckId ||
        lastActiveDeckId ||
        sorted[0]?.id ||
        null
      setPickDeckId(preferred)
      setAddModalOpen(true)
    },
    [decks, lastActiveDeckId, lastAddTargetDeckId],
  )

  const confirmAddToDeck = useCallback(() => {
    if (!pickDeckId) {
      toast.warning('请选择目标卡组')
      return
    }
    if (addModalCards.length === 1) {
      const r = addCardToDeck(addModalCards[0], pickDeckId)
      if (!r.ok) message.warning(r.reason)
      else message.success('已加入卡组')
    } else {
      const r = addCardsToDeck(addModalCards, pickDeckId)
      if (!r.ok) toast.warning(r.reason)
      else toast.success(`已加入 ${addModalCards.length} 张到卡组`)
    }
    setAddModalOpen(false)
    setAddModalCards([])
  }, [addCardToDeck, addCardsToDeck, addModalCards, pickDeckId])

  const handleToggleFavorite = useCallback(
    (card) => {
      toggleFavoriteCardId(card.id)
      void persistUserSettingsToDisk()
    },
    [toggleFavoriteCardId],
  )

  const handleUpdateDb = async () => {
    const api = window.electronAPI
    if (!api?.updateYgoDatabase) {
      toast.error('仅桌面版支持一键更新')
      return
    }
    const loadingToast = toast.loading({
      description: '正在从 YGOProDeck 下载全库 JSON…',
    })
    try {
      const res = await api.updateYgoDatabase()
      loadingToast.close()
      if (res.success) {
        toast.success(
          `已更新 ${res.count} 张卡牌数据（保存在用户目录，卡图仍走网络）`,
        )
        if (libraryMode === 'local') await loadLocalDatabase()
      } else {
        toast.error(res.error || '更新失败')
      }
    } catch (e) {
      loadingToast.close()
      toast.error(e.message || String(e))
    }
  }

  const goDetail = useCallback(
    (row) => {
      navigate(`/library/card/${row.id}`, { state: { card: row } })
    },
    [navigate],
  )

  const typeOptions =
    libraryMode === 'local' && summary?.byType
      ? Object.keys(summary.byType)
          .sort()
          .map((t) => ({ value: t, label: `${t} (${summary.byType[t]})` }))
      : YGO_TYPE_FILTERS

  const attrOptions =
    libraryMode === 'local' && summary?.byAttribute
      ? Object.keys(summary.byAttribute)
          .sort()
          .map((a) => ({
            value: a,
            label: `${a} (${summary.byAttribute[a]})`,
          }))
      : YGO_ATTRIBUTE_FILTERS

  const columns = useCardLibraryTableColumns({
    favoriteSet,
    downloadCardImage,
    openAddToDeckModal,
    handleToggleFavorite,
  })

  const localTotalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(filteredLocal.length / Math.max(1, libraryPageSize)),
      ),
    [filteredLocal.length, libraryPageSize],
  )

  const pageIds = useMemo(() => pageRows.map((r) => r.id), [pageRows])
  const allPageSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => librarySelectedRowKeys.includes(id))
  const somePageSelected =
    pageIds.length > 0 &&
    pageIds.some((id) => librarySelectedRowKeys.includes(id))

  const toggleSelectAllPage = useCallback(() => {
    const ids = pageRows.map((r) => r.id)
    const prev = useRouteUiStore.getState().librarySelectedRowKeys
    const allSelected =
      ids.length > 0 && ids.every((id) => prev.includes(id))
    if (allSelected) {
      setLibrarySelectedRowKeys(prev.filter((id) => !ids.includes(id)))
    } else {
      setLibrarySelectedRowKeys([...new Set([...prev, ...ids])])
    }
  }, [pageRows, setLibrarySelectedRowKeys])

  const toggleRowKey = useCallback(
    (id, checked) => {
      const prev = useRouteUiStore.getState().librarySelectedRowKeys
      const has = prev.includes(id)
      if (checked && !has) setLibrarySelectedRowKeys([...prev, id])
      else if (!checked && has)
        setLibrarySelectedRowKeys(prev.filter((k) => k !== id))
    },
    [setLibrarySelectedRowKeys],
  )

  const showTable =
    libraryMode === 'online' ||
    (libraryMode === 'local' && !missingDb && cards.length > 0)

  /** 桌面版：后台缓存当前列表卡图与元数据到数据目录，便于离线展示与卡组界面加速 */
  useEffect(() => {
    if (!showTable || !pageRows?.length) return undefined
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api?.ygoCardCacheEnsure) return undefined
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        const chunk = 8
        for (let i = 0; i < pageRows.length; i += chunk) {
          if (cancelled) break
          await Promise.all(
            pageRows.slice(i, i + chunk).map((c) => ensureYgoCardCached(c)),
          )
        }
      })()
    }, 450)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [showTable, pageRows])

  return (
    <div className="card-library">
      <div className="card-library-header">
        <h1 className="page-title">
          <Library size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          卡牌数据库
        </h1>
        <div className="card-library-toolbar-row">
          <Segmented
            options={[
              { label: '在线查询（API）', value: 'online' },
              { label: '本地全库', value: 'local' },
            ]}
            value={libraryMode}
            onChange={(v) =>
              startModeTransition(() => {
                setLibraryMode(v)
              })
            }
          />
          <div className="card-library-header-spacer" aria-hidden="true" />
          <Button icon={<RefreshCw size={16} />} onClick={handleUpdateDb}>
            更新数据库
          </Button>
        </div>
        <p className="card-library-hint">
          在线模式：按名称、类型、属性调用{' '}
          <a href="https://ygoprodeck.com/api-guide/" target="_blank" rel="noreferrer">
            YGOProDeck API
          </a>{' '}
          分页查询，每页条数可在「设置」中调整。双击一行打开卡牌详情。
        </p>
        {libraryMode === 'local' && meta?.fetchedAt && (
          <p className="card-library-meta">
            本地数据：{meta.fetchedAt} · {meta.count ?? cards.length} 张 · 来源{' '}
            {meta.source}
            {dbSource === 'userdata' ? '（用户目录）' : '（安装包）'}
          </p>
        )}
      </div>

      {libraryMode === 'local' && missingDb && !loading && (
        <div className="card-library-empty-db">
          <p>未找到本地全库 JSON。</p>
          <p className="hint">
            点击上方「更新数据库」下载到用户目录，或在开发环境执行{' '}
            <code>npm run cards:fetch</code> 写入 <code>src/assets/cards/data/</code> 后重新打包。
          </p>
        </div>
      )}

      {(error || apiError) && (
        <div className="card-library-error">{error || apiError}</div>
      )}

      {showTable && (
        <CardLibraryToolbarTable
          libraryMode={libraryMode}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          typeOptions={typeOptions}
          attrOptions={attrOptions}
          filterType={filterType}
          filterAttr={filterAttr}
          setFilters={setFilters}
          apiPage={apiPage}
          apiPageSize={apiPageSize}
          apiHasMore={apiHasMore}
          loading={loading}
          fetchOnlinePage={fetchOnlinePage}
          pageRows={pageRows}
          filteredLocal={filteredLocal}
          librarySelectedRowKeys={librarySelectedRowKeys}
          openAddToDeckModal={openAddToDeckModal}
          toast={toast}
          columns={columns}
          allPageSelected={allPageSelected}
          somePageSelected={somePageSelected}
          toggleSelectAllPage={toggleSelectAllPage}
          toggleRowKey={toggleRowKey}
          goDetail={goDetail}
          libraryPageSize={libraryPageSize}
          libraryLocalPage={libraryLocalPage}
          localTotalPages={localTotalPages}
          setLibraryLocalPage={setLibraryLocalPage}
        />
      )}

      <CardLibraryAddToDeckModal
        open={addModalOpen}
        addModalCards={addModalCards}
        decksForPicker={decksForPicker}
        pickDeckId={pickDeckId}
        setPickDeckId={setPickDeckId}
        onOk={confirmAddToDeck}
        onCancel={() => {
          setAddModalOpen(false)
          setAddModalCards([])
        }}
      />
    </div>
  )
}
