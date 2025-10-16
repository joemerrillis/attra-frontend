# Build Marketing Site Layout

## Objective
Create the public-facing landing page at `attra.io` that explains Attra's value proposition and drives signups. The page should embody the ●>attra>● brand identity and communicate "The attribution layer for the real world" instantly.

## Dependencies
- None (first file in build sequence)

## Tech Stack
- **Framework:** Next.js 14+ (static export) OR Astro 3+
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion (optional) or Tailwind transitions
- **Deployment:** Cloudflare Pages or Vercel

---

## Page Structure

### Route: `/` (attra.io)

```
┌─────────────────────────────────────────┐
│ HEADER                                  │
│ [●>attra>●]              [Login]        │
├─────────────────────────────────────────┤
│ HERO SECTION                            │
│ "Measure the Real World"                │
│ [Start Free] [See Demo]                 │
│ Background: Animated map                │
├─────────────────────────────────────────┤
│ HOW IT WORKS                            │
│ ●> Create → Distribute → Track >●      │
├─────────────────────────────────────────┤
│ INDUSTRIES GRID                         │
│ [Real Estate] [Home Services] etc.      │
├─────────────────────────────────────────┤
│ TESTIMONIALS / SOCIAL PROOF             │
├─────────────────────────────────────────┤
│ FINAL CTA                               │
│ "Start measuring your ground game"      │
├─────────────────────────────────────────┤
│ FOOTER                                  │
│ Docs | Pricing | Blog | Login           │
└─────────────────────────────────────────┘
```

---

## File Structure

```
marketing/
├── pages/
│   └── index.tsx (or index.astro)
├── components/
│   ├── Hero.tsx
│   ├── AnimatedMap.tsx
│   ├── HowItWorks.tsx
│   ├── IndustryGrid.tsx
│   ├── Testimonials.tsx
│   ├── FinalCTA.tsx
│   └── Footer.tsx
├── lib/
│   └── constants.ts
└── public/
    ├── logo.svg (●>attra>● logo)
    └── images/
```

---

## Component Specifications

### 1. Hero Section

**File:** `components/Hero.tsx`

```typescript
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimatedMap from './AnimatedMap';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated map background */}
      <div className="absolute inset-0 z-0">
        <AnimatedMap />
      </div>
      
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/90 z-10" />
      
      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            ●<span className="text-blue-600">&gt;</span>attra<span className="text-blue-600">&gt;</span>●
          </h1>
        </div>
        
        {/* Headline */}
        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Measure the Real World
        </h2>
        
        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Attra turns printed flyers, cards, and signs into measurable digital campaigns. 
          Track scans, leads, and ROI — all in real time.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="https://app.attra.io/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <button 
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            See Demo
          </button>
        </div>
        
        {/* Subtext */}
        <p className="mt-6 text-sm text-gray-500">
          Free forever. No credit card required.
        </p>
      </div>
    </section>
  );
}
```

---

### 2. Animated Map Background

**File:** `components/AnimatedMap.tsx`

Simple version using CSS (can be enhanced later):

```typescript
'use client';

import { useEffect, useState } from 'react';

interface Pin {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function AnimatedMap() {
  const [pins, setPins] = useState<Pin[]>([]);
  
  useEffect(() => {
    // Generate random pins
    const newPins = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setPins(newPins);
  }, []);
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Animated pins */}
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="absolute w-3 h-3 bg-blue-500 rounded-full animate-pulse"
          style={{
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            animationDelay: `${pin.delay}s`,
          }}
        >
          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        </div>
      ))}
    </div>
  );
}
```

---

### 3. How It Works

**File:** `components/HowItWorks.tsx`

```typescript
export default function HowItWorks() {
  const steps = [
    {
      symbol: '●>',
      title: 'Create',
      description: 'Generate branded flyers with QR codes in minutes',
    },
    {
      symbol: '→',
      title: 'Distribute',
      description: 'Print and place your materials where customers are',
    },
    {
      symbol: '>●',
      title: 'Track',
      description: 'Watch scans turn into leads on your live dashboard',
    },
  ];
  
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">
          Built for Your Ground Game
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-4">
                {step.symbol}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
        
        {/* Video demo placeholder */}
        <div className="mt-16 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Demo video placeholder</p>
        </div>
      </div>
    </section>
  );
}
```

---

### 4. Industry Grid

**File:** `components/IndustryGrid.tsx`

```typescript
import { Home, Dog, Briefcase, Wrench, Leaf } from 'lucide-react';

export default function IndustryGrid() {
  const industries = [
    { name: 'Real Estate', icon: Home, color: 'blue' },
    { name: 'Pet Services', icon: Dog, color: 'purple' },
    { name: 'Home Services', icon: Wrench, color: 'orange' },
    { name: 'Landscaping', icon: Leaf, color: 'green' },
    { name: 'Professional Services', icon: Briefcase, color: 'indigo' },
  ];
  
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4">
          Trusted by Service Businesses
        </h2>
        <p className="text-xl text-gray-600 text-center mb-16">
          From dog walkers to real estate pros, Attra powers offline attribution
        </p>
        
        <div className="grid md:grid-cols-5 gap-6">
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <div
                key={industry.name}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer text-center"
              >
                <Icon className={`w-12 h-12 mx-auto mb-3 text-${industry.color}-500`} />
                <h3 className="font-semibold">{industry.name}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

---

### 5. Testimonials

**File:** `components/Testimonials.tsx`

```typescript
export default function Testimonials() {
  const testimonials = [
    {
      quote: "Attra helped us track which neighborhoods generate the most leads. We've tripled our marketing ROI.",
      author: "Sarah Johnson",
      role: "Real Estate Agent",
      company: "Brooklyn Homes",
    },
    {
      quote: "Before Attra, we had no idea which flyers were working. Now we know exactly where to focus.",
      author: "Mike Chen",
      role: "Owner",
      company: "Paws & Play Dog Walking",
    },
    {
      quote: "The live map showing scans in real-time is incredible. It's like Google Analytics for flyers.",
      author: "Jessica Martinez",
      role: "Marketing Director",
      company: "CleanCo Services",
    },
  ];
  
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16">
          Real Results from Real Businesses
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
              <div className="border-t border-gray-200 pt-4">
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### 6. Final CTA

**File:** `components/FinalCTA.tsx`

```typescript
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-6 text-center text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Start Measuring Your Ground Game
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join hundreds of businesses turning flyers into data
        </p>
        <Link
          href="https://app.attra.io/signup"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors"
        >
          Get Started Free
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
        <p className="mt-4 text-sm opacity-75">
          No credit card required • Free forever
        </p>
      </div>
    </section>
  );
}
```

---

### 7. Footer

**File:** `components/Footer.tsx`

```typescript
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">●>attra>●</h3>
            <p className="text-sm">
              The attribution layer for the real world
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="https://docs.attra.io" className="hover:text-white">Documentation</Link></li>
              <li><Link href="https://app.attra.io/login" className="hover:text-white">Login</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>© 2025 Attra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## Main Page Assembly

### Next.js Version

**File:** `pages/index.tsx`

```typescript
import Head from 'next/head';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import IndustryGrid from '@/components/IndustryGrid';
import Testimonials from '@/components/Testimonials';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>Attra - Measure the Real World</title>
        <meta name="description" content="Turn flyers into measurable campaigns. Track scans, leads, and ROI in real time." />
        <meta property="og:title" content="Attra - The Attribution Layer for the Real World" />
        <meta property="og:description" content="Turn flyers into measurable campaigns." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <Hero />
        <HowItWorks />
        <IndustryGrid />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
```

---

## Configuration

### Tailwind Config

**File:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

---

## Deployment

### Option A: Vercel (Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set custom domain
vercel domains add attra.io
```

### Option B: Cloudflare Pages (Static)

```bash
# Build for static export
npm run build

# Deploy to Cloudflare Pages
# (Connect GitHub repo via Cloudflare dashboard)
```

---

## Environment Variables

**File:** `.env.example`

```bash
# No environment variables needed for marketing site
# All links point to app.attra.io which handles auth
```

---

## Testing

### Manual Tests

- [ ] Load `attra.io` - hero section visible
- [ ] Click "Start Free" - redirects to `app.attra.io/signup`
- [ ] Click "See Demo" - smooth scroll to demo section
- [ ] Animated map pins are pulsing
- [ ] All sections render correctly
- [ ] Footer links work
- [ ] Mobile responsive (test on phone)
- [ ] Fast load time (<2 seconds)

### Lighthouse Scores

Target:
- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

---

## Acceptance Criteria

- [ ] Marketing site loads at `attra.io`
- [ ] ●>attra>● logo visible in hero
- [ ] All 6 sections render correctly
- [ ] CTAs redirect to `app.attra.io/signup`
- [ ] Animated map background works
- [ ] Mobile responsive design
- [ ] Fast page load (<2s)
- [ ] SEO meta tags present
- [ ] Footer links functional
- [ ] No console errors

---

## Estimated Build Time

**3 hours**

## Priority

**High** - First user touchpoint

---

## Notes

- Marketing site should be **fast and simple**
- Focus on **clarity over complexity**
- Use real testimonials once available (placeholder for now)
- Consider adding video demo in "How It Works" section later
- Can enhance AnimatedMap with actual Mapbox integration in V2
