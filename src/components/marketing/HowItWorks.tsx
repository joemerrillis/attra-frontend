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
              <div className="text-5xl font-bold text-primary mb-4">
                {step.symbol}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Video demo placeholder */}
        <div id="demo" className="mt-16 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Demo video placeholder</p>
        </div>
      </div>
    </section>
  );
}
