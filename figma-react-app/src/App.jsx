import Header from './sections/Header'
import Hero from './sections/Hero'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import Testimonials from './sections/Testimonials'
import Pricing from './sections/Pricing'
import CTA from './sections/CTA'
import Footer from './sections/Footer'

/**
 * Main App Component
 * 
 * Structure based on typical SaaS landing page patterns.
 * 
 * IMPORTANT: To achieve pixel-perfect fidelity with Figma:
 * 1. Authenticate Figma MCP server in Cursor
 * 2. Use get_design_context on each section to get exact styling
 * 3. Use get_metadata to understand the component hierarchy
 * 4. Update tokens.css with values from get_variable_defs
 * 
 * Figma File: https://www.figma.com/design/kigwCTRVeLi0xz4kh6b33Y/AI-Testing-%7C-MCP-%7C-SaaS?node-id=22-877
 */
function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

export default App
