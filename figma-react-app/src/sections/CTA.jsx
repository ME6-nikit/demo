import Button from '../components/Button'
import './CTA.css'

/**
 * CTA Section
 * 
 * Call-to-action section encouraging sign-ups.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the CTA frame
 * - Extract exact spacing, colors, typography, and layout
 */
function CTA() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="cta__container container">
        <div className="cta__content">
          <h2 id="cta-title" className="cta__title">
            Ready to Transform Your AI Workflow?
          </h2>
          <p className="cta__description">
            Join thousands of teams already using MCP Platform to build, deploy, 
            and scale their AI applications. Start your free trial today.
          </p>
          <div className="cta__actions">
            <Button variant="primary" size="lg">
              Start Free Trial
            </Button>
            <Button variant="ghost" size="lg">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
