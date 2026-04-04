import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Icon from '../components/Icon'
import './Pricing.css'

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
    buttonVariant: 'outline',
    highlighted: false
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
    buttonVariant: 'primary',
    highlighted: true
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
    buttonVariant: 'outline',
    highlighted: false
  }
]

function Pricing() {
  return (
    <section id="pricing" className="pricing">
      <div className="pricing__inner container">
        <div className="pricing__header">
          <h2 className="pricing__title">Simple, Transparent Pricing</h2>
          <p className="pricing__description">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>
        
        <div className="pricing__grid">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              variant={plan.highlighted ? 'highlighted' : 'outlined'} 
              className="pricing__card"
            >
              {plan.highlighted && (
                <Badge variant="primary" className="pricing__badge">Most Popular</Badge>
              )}
              
              <div className="pricing__card-header">
                <h3 className="pricing__plan-name">{plan.name}</h3>
                <p className="pricing__plan-description">{plan.description}</p>
              </div>
              
              <div className="pricing__price">
                <span className="pricing__price-value">{plan.price}</span>
                {plan.period && <span className="pricing__price-period">{plan.period}</span>}
              </div>
              
              <ul className="pricing__features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="pricing__feature">
                    <Icon name="check" size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant={plan.buttonVariant} size="lg" fullWidth>
                {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
