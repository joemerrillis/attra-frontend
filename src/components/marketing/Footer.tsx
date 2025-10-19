export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">●&gt;attra&gt;●</h3>
            <p className="text-sm">
              The attribution layer for the real world
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="https://docs.attra.io" className="hover:text-white">Documentation</a></li>
              <li><a href="/login" className="hover:text-white">Login</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:text-white">About</a></li>
              <li><a href="/blog" className="hover:text-white">Blog</a></li>
              <li><a href="/careers" className="hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
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
