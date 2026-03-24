import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowRight, Box, Lightbulb, Package, Zap, Check } from "lucide-react";
import { motion } from "motion/react";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Box className="size-6 text-blue-600" />
            <span className="font-semibold text-xl">openFactory</span>
          </div>
          <Link to="/login">
            <Button variant="outline">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-5xl font-bold mb-6 text-slate-900">
            Turn vague ideas into execution-ready work packages for AI systems
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            openFactory is the design layer that transforms unclear intentions into structured, executable work that AI agents can actually run with.
          </p>
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Start a workspace
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Three Stages Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4">Three stages. One clear output.</h2>
          <p className="text-lg text-slate-600">From raw ideas to packaged execution in three collaborative steps</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Stage 1 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="size-6 text-amber-600" />
              <span className="font-semibold text-sm text-amber-900">STAGE 1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Raw / Define</h3>
            <p className="text-slate-600 mb-4">
              Pin your ideas to the board — anything goes. The Live Brief analyzes what you add and tells you when there's enough to move forward.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Collaborative pin board</li>
              <li>• Real-time brief synthesis</li>
              <li>• Readiness signals</li>
            </ul>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="size-6 text-slate-600" />
              <span className="font-semibold text-sm text-slate-900">STAGE 2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Shape</h3>
            <p className="text-slate-600 mb-4">
              Break your work into execution boxes. Define inputs, outputs, dependencies, and sequence. Get feedback from collaborators.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Work breakdown structure</li>
              <li>• Dependency mapping</li>
              <li>• Collaborative review</li>
            </ul>
          </div>

          {/* Stage 3 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="size-6 text-blue-600" />
              <span className="font-semibold text-sm text-blue-900">STAGE 3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Box</h3>
            <p className="text-slate-600 mb-4">
              Your work is packaged and ready for handoff. Export it to any AI system or share it with your team for approval.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Complete package assembly</li>
              <li>• Approval workflow</li>
              <li>• Portable export</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-slate-50 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">Built for any kind of work</h2>
            <p className="text-lg text-slate-600">From software to research, marketing to architecture</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Software Development", desc: "Spec features, APIs, and technical architecture" },
              { title: "Marketing Campaigns", desc: "Plan content, channels, and execution timelines" },
              { title: "Research Studies", desc: "Define methodologies, participants, and deliverables" },
              { title: "Architecture Projects", desc: "Structure requirements, phases, and documentation" },
            ].map((useCase, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">{useCase.title}</h3>
                <p className="text-sm text-slate-600">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-blue-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-semibold mb-4">Ready to turn ideas into execution?</h2>
          <p className="text-lg mb-8 text-blue-100">Start collaborating on your first workspace today</p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="gap-2">
              Get started
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Box className="size-5 text-blue-600" />
              <span className="font-semibold">openFactory</span>
            </div>
            <p className="text-sm text-slate-600">© 2026 openFactory. Specification layer for AI work.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}