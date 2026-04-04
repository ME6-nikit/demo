import Card from '../components/Card'
import './Testimonials.css'

/**
 * Testimonials Section
 * 
 * Customer testimonials and social proof.
 * 
 * TODO: Update layout and styling from Figma MCP:
 * - Use get_design_context on the Testimonials frame
 * - Extract exact spacing, colors, typography, and layout
 */

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
    avatar: "https://placehold.co/48x48/22C55E/FFFFFF?text=MR"
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
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials__container container">
        <div className="testimonials__header">
          <h2 id="testimonials-title" className="testimonials__title">
            Trusted by Industry Leaders
          </h2>
          <p className="testimonials__description">
            See what our customers have to say about their experience with MCP Platform.
          </p>
        </div>
        
        <div className="testimonials__grid">
          {testimonials.map((testimonial, index) => (
            <Card key={index} variant="elevated" padding="lg" className="testimonials__card">
              <blockquote className="testimonials__quote">
                <p className="testimonials__quote-text">"{testimonial.quote}"</p>
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
                  <cite className="testimonials__author-name">{testimonial.author}</cite>
                  <span className="testimonials__author-role">
                    {testimonial.role}, {testimonial.company}
                  </span>
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
