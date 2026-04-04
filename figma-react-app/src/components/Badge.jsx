import './Badge.css'

/**
 * Badge Component
 * 
 * Small label/tag component matching Figma badge components.
 * 
 * @param {Object} props
 * @param {'default' | 'primary' | 'success' | 'warning' | 'error'} props.variant - Badge color variant
 * @param {'sm' | 'md'} props.size - Badge size
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 */
function Badge({ 
  variant = 'default', 
  size = 'md',
  children, 
  className = '',
  ...props 
}) {
  const classNames = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  )
}

export default Badge
