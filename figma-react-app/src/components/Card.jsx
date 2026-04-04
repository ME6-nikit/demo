import './Card.css'

/**
 * Card Component
 * 
 * Reusable card container matching Figma card components.
 * 
 * @param {Object} props
 * @param {'default' | 'elevated' | 'outlined'} props.variant - Card style variant
 * @param {string} props.padding - Padding size (uses spacing tokens)
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 */
function Card({ 
  variant = 'default', 
  padding = 'md',
  children, 
  className = '',
  ...props 
}) {
  const classNames = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}

export default Card
