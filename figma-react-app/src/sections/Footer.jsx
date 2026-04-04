import './Footer.css'

/**
 * Footer Section
 * 
 * Site footer with navigation links and legal information.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the Footer frame
 * - Extract exact spacing, colors, typography, and layout
 */

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
      { label: 'Partners', href: '#' },
      { label: 'Press', href: '#' }
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Security', href: '#' }
    ]
  }
}

const socialLinks = [
  {
    label: 'Twitter',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M19.167 2.5a9.167 9.167 0 01-2.642.725A4.583 4.583 0 0018.533.9a9.167 9.167 0 01-2.917 1.117 4.583 4.583 0 00-7.808 4.175A13 13 0 011.558 1.458a4.583 4.583 0 001.417 6.117A4.542 4.542 0 011 7.075v.058a4.583 4.583 0 003.675 4.492 4.583 4.583 0 01-2.067.075 4.583 4.583 0 004.275 3.183A9.167 9.167 0 010 16.667a13 13 0 007.033 2.058c8.433 0 13.042-6.983 13.042-13.041 0-.2-.008-.4-.017-.592A9.333 9.333 0 0019.167 2.5z" fill="currentColor"/>
      </svg>
    )
  },
  {
    label: 'GitHub',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" fill="currentColor"/>
      </svg>
    )
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M18.333 0H1.667C.747 0 0 .747 0 1.667v16.666C0 19.253.747 20 1.667 20h16.666c.92 0 1.667-.747 1.667-1.667V1.667C20 .747 19.253 0 18.333 0zM5.933 17.083H2.983V7.5h2.95v9.583zM4.458 6.208a1.708 1.708 0 110-3.416 1.708 1.708 0 010 3.416zm12.625 10.875h-2.95v-4.667c0-1.113-.02-2.542-1.55-2.542-1.55 0-1.787 1.212-1.787 2.463v4.746h-2.95V7.5h2.833v1.308h.042c.395-.75 1.362-1.541 2.804-1.541 3 0 3.558 1.975 3.558 4.541v5.275z" fill="currentColor"/>
      </svg>
    )
  }
]

function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container container">
        <div className="footer__main">
          <div className="footer__brand">
            <a href="/" className="footer__logo" aria-label="Home">
              <svg 
                className="footer__logo-icon" 
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
              <span className="footer__logo-text">MCP Platform</span>
            </a>
            <p className="footer__tagline">
              Connect your AI solutions to the world seamlessly.
            </p>
            <div className="footer__social">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href} 
                  className="footer__social-link"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          <nav className="footer__nav" aria-label="Footer navigation">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="footer__nav-section">
                <h3 className="footer__nav-title">{section.title}</h3>
                <ul className="footer__nav-list">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="footer__nav-link">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        
        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {currentYear} MCP Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
