import Card from '../components/Card'
import Icon from '../components/Icon'
import './Testimonials.css'

const testimonials = [
  {
    quote: "MCP Platform transformed how we deploy AI. What used to take weeks now takes hours. The scalability is incredible.",
    author: "Sarah Chen",
    role: "CTO",
    company: "TechFlow Inc.",
    avatar: "https://placehold.co/48x48/6366F1/FFFFFF?text=SC"
  },
  {
    quote: "The security features gave us confidence to move our most sensitive workloads to the platform. SOC 2 compliance was seamless.",
    author: "Michael Rodriguez",
    role: "VP of Engineering",
    company: "SecureAI Labs",
    avatar: "https://placehold.co/48x48/10B981/FFFFFF?text=MR"
  },
  {
    quote: "Best developer experience I've encountered. The SDKs are well-documented and the support team is incredibly responsive.",
    author: "Emily Watson",
    role: "Lead Developer",
    company: "DataDriven Co.",
    avatar: "https://placehold.co/48x48/F59E0B/FFFFFF?text=EW"
  }
]

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials__inner container">
        <div className="testimonials__header">
          <h2 className="testimonials__title">Trusted by Industry Leaders</h2>
          <p className="testimonials__description">
            See what our customers have to say about their experience with MCP Platform.
          </p>
        </div>
        
        <div className="testimonials__grid">
          {testimonials.map((testimonial, index) => (
            <Card key={index} variant="elevated" className="testimonials__card">
              <div className="testimonials__rating" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="star" size={20} />
                ))}
              </div>
              <blockquote className="testimonials__quote">
                <p>"{testimonial.quote}"</p>
              </blockquote>
              <div className="testimonials__author">
                <img 
                  src={testimonial.avatar} 
                  alt=""
                  className="testimonials__avatar"
                  width="48"
                  height="48"
                />
                <div className="testimonials__author-info">
                  <cite className="testimonials__name">{testimonial.author}</cite>
                  <span className="testimonials__role">{testimonial.role}, {testimonial.company}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
