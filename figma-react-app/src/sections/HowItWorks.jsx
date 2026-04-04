import './HowItWorks.css'

/**
 * How It Works Section
 * 
 * Step-by-step guide showing the platform workflow.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the HowItWorks frame
 * - Extract exact spacing, colors, typography, and layout
 */

const steps = [
  {
    number: '01',
    title: 'Connect Your Data',
    description: 'Integrate your existing data sources with our secure connectors. Support for databases, APIs, and file storage.'
  },
  {
    number: '02',
    title: 'Configure Your AI',
    description: 'Choose from pre-built models or bring your own. Fine-tune parameters and set up custom workflows.'
  },
  {
    number: '03',
    title: 'Deploy & Scale',
    description: 'Launch your AI solution with one click. Our infrastructure automatically scales to meet demand.'
  },
  {
    number: '04',
    title: 'Monitor & Optimize',
    description: 'Track performance metrics and costs. Use insights to continuously improve your AI applications.'
  }
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works__container container">
        <div className="how-it-works__header">
          <h2 id="how-it-works-title" className="how-it-works__title">
            How It Works
          </h2>
          <p className="how-it-works__description">
            Get started in minutes with our simple four-step process.
          </p>
        </div>
        
        <div className="how-it-works__steps">
          {steps.map((step, index) => (
            <div key={index} className="how-it-works__step">
              <div className="how-it-works__step-number">
                {step.number}
              </div>
              <div className="how-it-works__step-content">
                <h3 className="how-it-works__step-title">{step.title}</h3>
                <p className="how-it-works__step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="how-it-works__step-connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
