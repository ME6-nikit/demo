import { useState } from 'react'
import Button from '../components/Button'
import './Header.css'

/**
 * Header Section
 * 
 * Navigation header with logo, menu items, and CTA buttons.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the Header frame
 * - Extract exact spacing, colors, and typography
 */
function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' },
  ]

  return (
    <header className="header">
      <div className="header__container container">
        <a href="/" className="header__logo" aria-label="Home">
          <svg 
            className="header__logo-icon" 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="var(--color-primary-600)" />
            <path 
              d="M8 16L14 22L24 10" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="header__logo-text">MCP Platform</span>
        </a>

        <nav className="header__nav" aria-label="Main navigation">
          <ul className="header__nav-list">
            {navItems.map((item) => (
              <li key={item.label} className="header__nav-item">
                <a href={item.href} className="header__nav-link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button variant="primary" size="sm">
            Get Started
          </Button>
        </div>

        <button 
          className="header__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <span className="header__mobile-toggle-bar" />
          <span className="header__mobile-toggle-bar" />
          <span className="header__mobile-toggle-bar" />
        </button>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="header__mobile-menu">
            <nav aria-label="Mobile navigation">
              <ul className="header__mobile-nav-list">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a 
                      href={item.href} 
                      className="header__mobile-nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="header__mobile-actions">
              <Button variant="ghost" size="md" fullWidth>
                Sign In
              </Button>
              <Button variant="primary" size="md" fullWidth>
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
