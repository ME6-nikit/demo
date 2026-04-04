import Button from '../components/Button'
import './CTA.css'

function CTA() {
  return (
    <section className="cta">
      <div className="cta__inner container">
        <div className="cta__content">
          <h2 className="cta__title">
            Ready to Transform Your AI Workflow?
          </h2>
          <p className="cta__description">
            Join thousands of teams already using MCP Platform to build, deploy, 
            and scale their AI applications. Start your free trial today.
          </p>
          <div className="cta__actions">
            <Button variant="white" size="lg">Start Free Trial</Button>
            <Button variant="ghost" size="lg" className="cta__ghost-btn">Schedule a Demo</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
