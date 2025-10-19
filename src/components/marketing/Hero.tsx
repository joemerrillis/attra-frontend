import { ArrowRight } from 'lucide-react';
import AnimatedMap from './AnimatedMap';
import { Button } from '@/components/ui/button';

export default function Hero() {
  const handleSeeDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

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
            ●<span className="text-primary">&gt;</span>attra<span className="text-primary">&gt;</span>●
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
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = '/signup'}
          >
            Start Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6"
            onClick={handleSeeDemo}
          >
            See Demo
          </Button>
        </div>

        {/* Subtext */}
        <p className="mt-6 text-sm text-gray-500">
          Free forever. No credit card required.
        </p>
      </div>
    </section>
  );
}
