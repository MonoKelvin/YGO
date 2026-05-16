/**
 * 各主内容页统一页头：标题、副标题、右侧操作区。
 */
export default function PageHeader({
  title,
  icon: Icon,
  iconSize = 22,
  lead = null,
  actions = null,
  children = null,
  className = '',
}) {
  const headerClass = ['ygo-page-header', className].filter(Boolean).join(' ')

  return (
    <header className={headerClass}>
      <div className="ygo-page-header-main">
        <h1 className="ygo-page-title">
          {Icon ? (
            <Icon size={iconSize} className="ygo-page-title-icon" aria-hidden />
          ) : null}
          <span className="ygo-page-title-text">{title}</span>
        </h1>
        {lead ? <p className="ygo-page-lead">{lead}</p> : null}
      </div>
      {actions ? (
        <div className="ygo-page-header-actions">{actions}</div>
      ) : null}
      {children}
    </header>
  )
}
