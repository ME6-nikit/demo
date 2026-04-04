import Button from '../components/Button'
import Badge from '../components/Badge'
import './Hero.css'

/**
 * Hero Section
 * 
 * Main hero section with headline, description, and CTAs.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the Hero frame
 * - Extract exact spacing, colors, typography, and layout
 */
function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__container container">
        <div className="hero__content">
          <Badge variant="primary" size="md">
            New: AI-Powered Testing
          </Badge>
          
          <h1 id="hero-title" className="hero__title">
            Connect Your AI Solutions to the World Seamlessly
          </h1>
          
          <p className="hero__description">
            The MCP platform enables secure, scalable, and flexible AI deployments. 
            Build powerful integrations with enterprise-grade infrastructure and 
            developer-friendly tools.
          </p>
          
          <div className="hero__actions">
            <Button variant="primary" size="lg">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </div>
          
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-value">10K+</span>
              <span className="hero__stat-label">Active Users</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">99.9%</span>
              <span className="hero__stat-label">Uptime SLA</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">50M+</span>
              <span className="hero__stat-label">API Calls/Day</span>
            </div>
          </div>
        </div>
        
        <div className="hero__visual">
          <div className="hero__image-wrapper">
            <img 
              src="https://placehold.co/600x400/6366F1/FFFFFF?text=Platform+Preview" 
              alt="MCP Platform dashboard showing AI integration capabilities"
              className="hero__image"
              width="600"
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
