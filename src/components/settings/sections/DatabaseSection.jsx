import { Select } from '@lobehub/ui/base-ui'
import {
  DEFAULT_LIBRARY_PAGE_SIZE,
  LIBRARY_PAGE_SIZE_OPTIONS,
  normalizeLibraryPageSize,
} from '../../../config/librarySettings'

const libraryPageSizeOptions = LIBRARY_PAGE_SIZE_OPTIONS.map((n) => ({
  value: n,
  label: `${n} 张 / 页`,
}))

/**
 * 数据库设置区块
 * @param {Object} props
 * @param {Object} props.settings - 当前设置
 * @param {Function} props.onLibraryPageSizeChange - 每页条数变更回调
 */
export default function DatabaseSection({ settings, onLibraryPageSizeChange }) {
  return [
    {
      label: '在线查询每页条数',
      desc: '设置在线API查询时每页显示的卡牌数量',
      name: 'libraryPageSize',
      children: (
        <Select
          variant="outlined"
          options={libraryPageSizeOptions}
          value={normalizeLibraryPageSize(
            settings.libraryPageSize ?? DEFAULT_LIBRARY_PAGE_SIZE,
          )}
          allowClear={false}
          onChange={onLibraryPageSizeChange}
          style={{ minWidth: 120 }}
          placement="bottomRight"
        />
      ),
    },
  ]
}
