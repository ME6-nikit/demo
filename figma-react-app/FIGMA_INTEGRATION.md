# Figma to React Implementation Guide

## Overview

This React application is a scaffold for implementing the design from the Figma file:
**[AI Testing | MCP | SaaS](https://www.figma.com/design/kigwCTRVeLi0xz4kh6b33Y/AI-Testing-%7C-MCP-%7C-SaaS?node-id=22-877)**

## Current Status

### Limitation: Figma MCP Authentication Required

The Figma MCP server requires OAuth authentication through a browser-based flow. This authentication cannot be completed in a headless cloud agent environment.

**To achieve pixel-perfect fidelity, you must:**

1. Authenticate the Figma MCP server in your local Cursor IDE
2. Use the MCP tools to extract exact design values
3. Update the design tokens and component styles accordingly

## How to Complete the Implementation

### Step 1: Set Up Figma MCP Server

In Cursor, run:
```
/add-plugin figma
```

Or manually configure MCP in `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

### Step 2: Authenticate

1. Click "Connect" next to Figma in Cursor's MCP settings
2. Complete the OAuth flow in your browser
3. Allow access to your Figma account

### Step 3: Extract Design Tokens

Use these prompts with the Figma link:

**Get all variables (colors, spacing, typography):**
```
Get the variables used in https://www.figma.com/design/kigwCTRVeLi0xz4kh6b33Y/AI-Testing-%7C-MCP-%7C-SaaS?node-id=22-877
```

**Get design context for each section:**
```
Get the design context for the Hero section in https://www.figma.com/design/kigwCTRVeLi0xz4kh6b33Y/AI-Testing-%7C-MCP-%7C-SaaS?node-id=22-877
```

**Get metadata for component structure:**
```
Get metadata for https://www.figma.com/design/kigwCTRVeLi0xz4kh6b33Y/AI-Testing-%7C-MCP-%7C-SaaS?node-id=22-877
```

### Step 4: Update Design Tokens

Update `/src/styles/tokens.css` with the exact values from Figma:

- Colors (from Figma variables)
- Typography (font-family, font-size, font-weight, line-height, letter-spacing)
- Spacing (from auto-layout gaps and padding)
- Border radius (from corner radius)
- Shadows (from drop shadow effects)

### Step 5: Update Component Styles

For each section, use `get_design_context` to get exact styling and update the corresponding CSS file:

| Section | CSS File |
|---------|----------|
| Header | `/src/sections/Header.css` |
| Hero | `/src/sections/Hero.css` |
| Features | `/src/sections/Features.css` |
| How It Works | `/src/sections/HowItWorks.css` |
| Testimonials | `/src/sections/Testimonials.css` |
| Pricing | `/src/sections/Pricing.css` |
| CTA | `/src/sections/CTA.css` |
| Footer | `/src/sections/Footer.css` |

## Project Structure

```
figma-react-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Button.css
│   │   ├── Card.jsx
│   │   ├── Card.css
│   │   ├── Badge.jsx
│   │   └── Badge.css
│   ├── sections/            # Page sections
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── Hero.jsx
│   │   ├── Hero.css
│   │   ├── Features.jsx
│   │   ├── Features.css
│   │   ├── HowItWorks.jsx
│   │   ├── HowItWorks.css
│   │   ├── Testimonials.jsx
│   │   ├── Testimonials.css
│   │   ├── Pricing.jsx
│   │   ├── Pricing.css
│   │   ├── CTA.jsx
│   │   ├── CTA.css
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── styles/              # Global styles and tokens
│   │   ├── tokens.css       # Design tokens (UPDATE FROM FIGMA)
│   │   └── global.css       # Global styles and reset
│   ├── assets/              # Images and icons
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── index.html
├── package.json
├── vite.config.js
└── FIGMA_INTEGRATION.md
```

## Responsive Breakpoints

Based on Figma constraints:

| Breakpoint | Width Range | Target |
|------------|-------------|--------|
| Mobile | 320px - 767px | Phones |
| Tablet | 768px - 1023px | Tablets |
| Desktop | 1024px+ | Desktop |

## Validation Checklist

After updating from Figma MCP, validate:

- [ ] Colors match exactly (use color picker to verify hex values)
- [ ] Typography matches (font-family, size, weight, line-height, letter-spacing)
- [ ] Spacing matches (padding, margin, gap)
- [ ] Border radius matches
- [ ] Shadows match
- [ ] Layout alignment matches (flex/grid properties)
- [ ] Responsive behavior matches Figma constraints

## Running the Project

```bash
cd figma-react-app
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

## MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `get_design_context` | Get styling for a frame/component |
| `get_variable_defs` | Get design tokens (colors, spacing, etc.) |
| `get_metadata` | Get component structure and hierarchy |
| `get_screenshot` | Get visual reference of selection |

## Validation Report Template

After implementation, document any differences:

```
- Element: [Component/Section name]
- Expected (Figma): [Value from Figma]
- Actual (Code): [Value in code]
- Reason: [Why the difference exists]
```
