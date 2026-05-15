import { forwardRef, useCallback } from 'react'
import { A } from '@lobehub/ui'
import { openExternalLink } from '../../utils/openExternalLink'

/**
 * 外部链接组件
 * 根据用户设置决定使用系统浏览器还是软件内部窗口打开链接
 *
 * @param {Object} props
 * @param {string} props.href - 链接地址
 * @param {React.ReactNode} props.children - 子元素
 * @param {string} [props.className] - 自定义类名
 * @param {Object} [props.style] - 自定义样式
 * @param {string} [props.title] - 标题提示
 * @param {Function} [props.onClick] - 点击回调（可选）
 */
const ExternalLink = forwardRef(function ExternalLink(
  { href, children, className, style, title, onClick, ...rest },
  ref
) {
  const handleClick = useCallback(
    async (e) => {
      e.preventDefault()
      e.stopPropagation()

      // 调用自定义点击回调（如果有）
      if (onClick) {
        onClick(e)
      }

      // 使用自定义函数打开链接
      await openExternalLink(href)
    },
    [href, onClick]
  )

  return (
    <A
      ref={ref}
      href={href}
      className={className}
      style={style}
      title={title}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </A>
  )
})

export default ExternalLink
