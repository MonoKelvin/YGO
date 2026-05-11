import { Flexbox } from '@lobehub/ui'
import { Loader2 } from 'lucide-react'

/** 全页或区块加载指示（替代 antd Spin） */
export default function PageSpinner({ tip }) {
  return (
    <Flexbox
      vertical
      align="center"
      justify="center"
      gap={12}
      style={{ padding: '48px 24px' }}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="ygo-spin" size={32} aria-hidden />
      {tip ? (
        <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          {tip}
        </span>
      ) : null}
    </Flexbox>
  )
}
