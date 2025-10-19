import { Home, Dog, Briefcase, Wrench, Leaf } from 'lucide-react';

export default function IndustryGrid() {
  const industries = [
    { name: 'Real Estate', icon: Home, color: 'text-blue-500' },
    { name: 'Pet Services', icon: Dog, color: 'text-purple-500' },
    { name: 'Home Services', icon: Wrench, color: 'text-orange-500' },
    { name: 'Landscaping', icon: Leaf, color: 'text-green-500' },
    { name: 'Professional Services', icon: Briefcase, color: 'text-indigo-500' },
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
                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer text-center"
              >
                <Icon className={`w-12 h-12 mx-auto mb-3 ${industry.color}`} />
                <h3 className="font-semibold">{industry.name}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
