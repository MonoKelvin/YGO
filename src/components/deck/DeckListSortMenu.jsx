import { useMemo } from 'react'
import { DropdownMenu, Button } from '@lobehub/ui'
import { ListFilter } from 'lucide-react'
import {
  DECK_LIST_SORT_OPTIONS,
  getDeckSortLabel,
} from '../../utils/deckListSort'

/**
 * 卡组列表排序：DropdownMenu + 互斥 checkbox 项。
 */
export default function DeckListSortMenu({ value, onChange }) {
  const items = useMemo(
    () =>
      DECK_LIST_SORT_OPTIONS.map((opt) => ({
        key: opt.value,
        label: opt.label,
        type: 'checkbox',
        checked: value === opt.value,
        onCheckedChange: (checked) => {
          if (checked) onChange(opt.value)
        },
      })),
    [value, onChange],
  )

  return (
    <DropdownMenu nativeButton items={items} placement="bottomRight">
      <Button
        variant="outlined"
        className="deck-list-sort-trigger"
        icon={<ListFilter size={16} />}
      >
        {getDeckSortLabel(value)}
      </Button>
    </DropdownMenu>
  )
}
