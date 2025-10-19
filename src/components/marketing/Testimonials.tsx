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
