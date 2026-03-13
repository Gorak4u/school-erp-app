// World-Class Production-Grade Landing Page
// Based on the School Management ERP UI Design Documents

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Hero, Features, Testimonials, Pricing, Badge, ButtonAdvanced } from '@/lib/design-system';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">ERP</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">School ERP</span>
                <div className="text-xs text-gray-500">Management System</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Features
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Pricing
              </Link>
              <Link href="#demo" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Demo
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Sign In
              </Link>
              <ButtonAdvanced variant="primary" size="sm">
                Get Started
              </ButtonAdvanced>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero 
        onGetStarted={() => console.log('Get Started')}
        onViewDemo={() => console.log('View Demo')}
      />

      {/* Features Section */}
      <section id="features" className="scroll-mt-20">
        <Features />
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="primary" size="lg" className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              📊 Platform Statistics
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Trusted by Educational Institutions Worldwide</h2>
            <p className="text-xl text-blue-100">Join thousands of schools already using our platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '5K+', label: 'Indian Schools', change: '+25%' },
              { value: '1M+', label: 'Students', change: '+40%' },
              { value: '25K+', label: 'Teachers', change: '+30%' },
              { value: '99.9%', label: 'Uptime', change: 'Stable' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100 mb-1">{stat.label}</div>
                <div className="text-green-300 text-sm font-medium">{stat.change}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="scroll-mt-20">
        <Testimonials />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-20">
        <Pricing />
      </section>

      {/* Demo Credentials Section */}
      <section id="demo" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" size="lg" className="mb-6">
                🚀 Try Demo Account
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Experience the Platform
              </h2>
              <p className="text-xl text-gray-600">
                Use these demo credentials to explore all features with different user roles
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {
                [
                  {
                    icon: "👨‍💼",
                    name: "Administrator",
                    role: "Full system access",
                    email: "admin@schoolerp.in",
                    password: "admin123",
                    color: "blue"
                  },
                  {
                    icon: "👩‍🏫",
                    name: "Teacher",
                    role: "Class management",
                    email: "teacher@schoolerp.in",
                    password: "teacher123",
                    color: "green"
                  },
                  {
                    icon: "👨‍🎓",
                    name: "Student",
                    role: "Learning portal",
                    email: "student@schoolerp.in",
                    password: "student123",
                    color: "purple"
                  },
                  {
                    icon: "👨‍👩‍👧‍👦",
                    name: "Parent",
                    role: "Progress monitoring",
                    email: "parent@schoolerp.in",
                    password: "parent123",
                    color: "orange"
                  }
                ].map((account, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${
                            account.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                            account.color === 'green' ? 'from-green-500 to-emerald-500' :
                            account.color === 'purple' ? 'from-purple-500 to-pink-500' :
                            'from-orange-500 to-red-500'
                          } rounded-lg flex items-center justify-center text-xl`}>
                            {account.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{account.name}</h3>
                            <p className="text-sm text-gray-500">{account.role}</p>
                          </div>
                        <Badge variant={
                          account.color === 'blue' ? 'primary' :
                          account.color === 'green' ? 'success' :
                          account.color === 'purple' ? 'secondary' :
                          'warning'
                        }>
                          {account.name.charAt(0)}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="font-mono text-sm text-gray-700 mb-1">{account.email}</div>
                      <div className="font-mono text-sm text-gray-500">{account.password}</div>
                    </div>
                    <Link href="/login">
                      <ButtonAdvanced 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                      >
                        Login as {account.name}
                      </ButtonAdvanced>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <ButtonAdvanced variant="primary" size="lg" className="px-8">
                Start Demo Now
              </ButtonAdvanced>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="primary" size="lg" className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm">
            🎯 Ready to Transform Your School?
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join the Education Revolution
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see why thousands of educational institutions 
            trust School ERP to transform their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register">
              <ButtonAdvanced 
                variant="primary" 
                size="lg" 
                className="px-8 bg-white text-blue-600 hover:bg-gray-100"
              >
                Start Free Trial
              </ButtonAdvanced>
            </Link>
            <Link href="/login">
              <ButtonAdvanced 
                variant="outline" 
                size="lg" 
                className="px-8 border-white text-white hover:bg-white hover:text-blue-600"
              >
                Sign In to Demo
              </ButtonAdvanced>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              No setup fee
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ERP</span>
                </div>
                <span className="text-xl font-bold">School ERP</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transforming education through innovative technology and AI-powered insights.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 School ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
