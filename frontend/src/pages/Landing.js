import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileSearch, Brain, Shield, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileSearch className="w-6 h-6" />,
      title: "Multi-Document Intelligence",
      description: "Upload PDFs, Word docs, images, and text files. Extract insights across multiple sources."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Explainable AI Answers",
      description: "Every answer comes with citations, source highlighting, and confidence scores."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Hallucination Guard",
      description: "AI refuses to answer when evidence is insufficient. Grounded in your documents only."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Retrieval",
      description: "Advanced semantic search with relevance scoring and evidence highlighting."
    }
  ];

  const benefits = [
    "Cross-document reasoning and comparison",
    "Research-grade citations with source tracking",
    "Retrieval debug panel for transparency",
    "Multiple answer modes: Concise, Detailed, Research"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            <span className="font-heading text-2xl font-bold tracking-tight">NeuroQuery</span>
          </div>
          <button
            data-testid="launch-app-btn"
            onClick={() => navigate('/chat')}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-all active:scale-95"
          >
            Launch App
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-7 space-y-8"
          >
            <h1 className="font-heading text-5xl lg:text-7xl font-medium leading-none tracking-tight text-foreground">
              Explainable RAG-Powered<br />
              <span className="text-primary">Research Intelligence</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Upload your documents and ask questions. Get grounded, citation-backed answers with full transparency.
              Built for researchers, analysts, and professionals who need trustworthy AI.
            </p>
            <div className="flex gap-4">
              <button
                data-testid="get-started-btn"
                onClick={() => navigate('/chat')}
                className="px-8 py-4 bg-primary text-white rounded-md font-medium text-lg hover:bg-primary/90 transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5"
          >
            <img 
              src="https://images.unsplash.com/photo-1765046255517-412341954c4c?crop=entropy&cs=srgb&fm=jpg&q=85" 
              alt="Abstract visualization" 
              className="rounded-lg shadow-lg w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-secondary/30 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-medium tracking-tight mb-4">Powered by Advanced RAG</h2>
            <p className="text-muted-foreground text-lg">Retrieval-Augmented Generation with full explainability</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-border rounded-lg p-8 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-heading text-4xl font-medium tracking-tight mb-6">Built for Research Excellence</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              NeuroQuery isn't just another chatbot. It's a research-grade tool that provides transparency,
              accountability, and trustworthy answers backed by your documents.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1761505976134-e7d71f8747b9?crop=entropy&cs=srgb&fm=jpg&q=85" 
              alt="Research visualization" 
              className="rounded-lg shadow-xl w-full"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-tight">
            Start Querying Your Documents Today
          </h2>
          <p className="text-lg text-white/90">
            Upload your research papers, policy documents, or reports and get intelligent, explainable answers.
          </p>
          <button
            data-testid="cta-launch-btn"
            onClick={() => navigate('/chat')}
            className="px-8 py-4 bg-white text-primary rounded-md font-medium text-lg hover:bg-white/90 transition-all shadow-lg active:scale-95"
          >
            Launch NeuroQuery
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <p className="mb-2">NeuroQuery - Explainable RAG-Powered Intelligence Platform</p>
          <p className="text-sm">Built with RAG, Vector Search, and Grounded AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
