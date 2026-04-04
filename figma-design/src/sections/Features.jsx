import Card from '../components/Card'
import Icon from '../components/Icon'
import './Features.css'

const features = [
  {
    icon: 'lightning',
    title: 'Lightning Fast',
    description: 'Deploy AI models in seconds with our optimized infrastructure. Experience sub-100ms response times globally.'
  },
  {
    icon: 'shield',
    title: 'Enterprise Security',
    description: 'SOC 2 Type II certified with end-to-end encryption. Your data stays secure with zero-trust architecture.'
  },
  {
    icon: 'chart',
    title: 'Real-time Analytics',
    description: 'Monitor your AI deployments with comprehensive dashboards. Track usage, performance, and costs in real-time.'
  },
  {
    icon: 'users',
    title: 'Team Collaboration',
    description: 'Work together seamlessly with role-based access control, shared workspaces, and real-time collaboration.'
  },
  {
    icon: 'code',
    title: 'Developer Friendly',
    description: 'Comprehensive REST API, SDKs for popular languages, and webhook support for seamless integration.'
  },
  {
    icon: 'layers',
    title: 'Auto Scaling',
    description: 'Handle any workload with automatic scaling. Pay only for what you use with transparent pricing.'
  }
]

function Features() {
  return (
    <section id="features" className="features">
      <div className="features__inner container">
        <div className="features__header">
          <h2 className="features__title">
            Powerful Features for Modern AI Teams
          </h2>
          <p className="features__description">
            Everything you need to build, deploy, and scale AI applications with confidence.
          </p>
        </div>
        
        <div className="features__grid">
          {features.map((feature, index) => (
            <Card key={index} variant="outlined" className="features__card">
              <div className="features__icon">
                <Icon name={feature.icon} size={24} />
              </div>
              <h3 className="features__card-title">{feature.title}</h3>
              <p className="features__card-description">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
