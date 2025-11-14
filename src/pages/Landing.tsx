import Hero from '@/components/marketing/Hero';
import HowItWorks from '@/components/marketing/HowItWorks';
import IndustryGrid from '@/components/marketing/IndustryGrid';
import Testimonials from '@/components/marketing/Testimonials';
import FinalCTA from '@/components/marketing/FinalCTA';
import Footer from '@/components/marketing/Footer';

export default function Landing() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <IndustryGrid />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}