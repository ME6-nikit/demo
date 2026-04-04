import Button from '../components/Button'
import Badge from '../components/Badge'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner container">
        <div className="hero__content">
          <Badge variant="primary">New: AI-Powered Integration</Badge>
          
          <h1 className="hero__title">
            Connect Your AI Solutions to the World Seamlessly
          </h1>
          
          <p className="hero__description">
            The MCP platform enables secure, scalable, and flexible AI deployments. 
            Build powerful integrations with enterprise-grade infrastructure and 
            developer-friendly tools.
          </p>
          
          <div className="hero__actions">
            <Button variant="primary" size="lg">Start Free Trial</Button>
            <Button variant="outline" size="lg">Watch Demo</Button>
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
          <div className="hero__image">
            <img 
              src="https://placehold.co/600x400/6366F1/FFFFFF?text=Platform+Preview" 
              alt="MCP Platform dashboard showing AI integration workflow"
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
