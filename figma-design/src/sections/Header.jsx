import { useState } from 'react'
import Button from '../components/Button'
import Icon from '../components/Icon'
import './Header.css'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' }
  ]

  return (
    <header className="header">
      <div className="header__inner container">
        <a href="/" className="header__logo" aria-label="MCP Platform Home">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--color-primary-600)"/>
            <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="header__logo-text">MCP Platform</span>
        </a>

        <nav className="header__nav" aria-label="Main navigation">
          <ul className="header__nav-list">
            {navLinks.map(link => (
              <li key={link.label}>
                <a href={link.href} className="header__nav-link">{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button variant="primary" size="sm">Get Started</Button>
        </div>

        <button 
          className="header__menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
        </button>
      </div>

      {menuOpen && (
        <div className="header__mobile-menu">
          <nav aria-label="Mobile navigation">
            <ul className="header__mobile-nav">
              {navLinks.map(link => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="header__mobile-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header__mobile-actions">
            <Button variant="ghost" size="md" fullWidth>Sign In</Button>
            <Button variant="primary" size="md" fullWidth>Get Started</Button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
