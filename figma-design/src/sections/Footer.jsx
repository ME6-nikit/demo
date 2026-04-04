import Icon from '../components/Icon'
import './Footer.css'

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' }
    ]
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Community', href: '#' }
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Partners', href: '#' }
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' }
    ]
  }
}

const socialLinks = [
  { name: 'twitter', href: '#', label: 'Twitter' },
  { name: 'linkedin', href: '#', label: 'LinkedIn' },
  { name: 'github', href: '#', label: 'GitHub' }
]

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__main">
          <div className="footer__brand">
            <a href="/" className="footer__logo" aria-label="MCP Platform Home">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="var(--color-primary-600)"/>
                <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="footer__logo-text">MCP Platform</span>
            </a>
            <p className="footer__tagline">
              Connect your AI solutions to the world seamlessly.
            </p>
            <div className="footer__social">
              {socialLinks.map(social => (
                <a 
                  key={social.name}
                  href={social.href} 
                  className="footer__social-link"
                  aria-label={social.label}
                >
                  <Icon name={social.name} size={20} />
                </a>
              ))}
            </div>
          </div>

          <nav className="footer__nav" aria-label="Footer navigation">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="footer__nav-section">
                <h3 className="footer__nav-title">{section.title}</h3>
                <ul className="footer__nav-list">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="footer__nav-link">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} MCP Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
