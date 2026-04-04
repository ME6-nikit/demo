import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import './Pricing.css'

/**
 * Pricing Section
 * 
 * Pricing tiers and comparison.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the Pricing frame
 * - Extract exact spacing, colors, typography, and layout
 */

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small projects',
    price: '$29',
    period: '/month',
    features: [
      '1,000 API calls/month',
      '1 team member',
      'Basic analytics',
      'Email support',
      'Community access'
    ],
    cta: 'Start Free Trial',
    variant: 'outline',
    popular: false
  },
  {
    name: 'Professional',
    description: 'For growing teams and businesses',
    price: '$99',
    period: '/month',
    features: [
      '50,000 API calls/month',
      '10 team members',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'SSO authentication'
    ],
    cta: 'Start Free Trial',
    variant: 'primary',
    popular: true
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 'Custom',
    period: '',
    features: [
      'Unlimited API calls',
      'Unlimited team members',
      'Enterprise analytics',
      'Dedicated support',
      'Custom SLA',
      'On-premise option',
      'Advanced security'
    ],
    cta: 'Contact Sales',
    variant: 'outline',
    popular: false
  }
]

function Pricing() {
  return (
    <section id="pricing" className="pricing" aria-labelledby="pricing-title">
      <div className="pricing__container container">
        <div className="pricing__header">
          <h2 id="pricing-title" className="pricing__title">
            Simple, Transparent Pricing
          </h2>
          <p className="pricing__description">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>
        
        <div className="pricing__grid">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              variant={plan.popular ? 'elevated' : 'outlined'} 
              padding="lg" 
              className={`pricing__card ${plan.popular ? 'pricing__card--popular' : ''}`}
            >
              {plan.popular && (
                <Badge variant="primary" size="sm" className="pricing__badge">
                  Most Popular
                </Badge>
              )}
              
              <div className="pricing__card-header">
                <h3 className="pricing__plan-name">{plan.name}</h3>
                <p className="pricing__plan-description">{plan.description}</p>
              </div>
              
              <div className="pricing__price">
                <span className="pricing__price-value">{plan.price}</span>
                {plan.period && (
                  <span className="pricing__price-period">{plan.period}</span>
                )}
              </div>
              
              <ul className="pricing__features" role="list">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="pricing__feature">
                    <svg 
                      className="pricing__feature-icon" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      fill="none"
                      aria-hidden="true"
                    >
                      <path 
                        d="M16.6667 5L7.50001 14.1667L3.33334 10" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.variant} 
                size="lg" 
                fullWidth
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
