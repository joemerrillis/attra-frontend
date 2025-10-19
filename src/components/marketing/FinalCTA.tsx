import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Button
          size="lg"
          className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
          onClick={() => window.location.href = '/signup'}
        >
          Get Started Free
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="mt-4 text-sm opacity-75">
          No credit card required • Free forever
        </p>
      </div>
    </section>
  );
}
