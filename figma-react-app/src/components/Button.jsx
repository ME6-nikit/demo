import './Button.css'

/**
 * Button Component
 * 
 * Variants and styles should match Figma button components.
 * Use get_design_context on Figma button instances to get exact styling.
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.fullWidth - Whether button takes full width
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 */
function Button({ 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  children, 
  className = '',
  ...props 
}) {
  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    className
  ].filter(Boolean).join(' ')

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  )
}

export default Button
