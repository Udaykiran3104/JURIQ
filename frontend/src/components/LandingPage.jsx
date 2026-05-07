import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion';
import { Scale, ArrowRight, ShieldCheck, Moon, Sun, BookOpen, Globe, Lock, Mic, MessageSquare, Zap, Database, Brain, ChevronDown, FileText, Languages, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import juriqLogo_DarkMode from '../JURIQ/JQ Logo Dark Mode.png';
import juriqLogo_WhiteMode from '../JURIQ/JQ Logo White Mode.png';

// --- MAGNETIC 3D TILT CARD ---
const TiltCard = ({ children, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      className={`relative ${className}`}
    >
      <div style={{ transform: "translateZ(30px)" }}>{children}</div>
    </motion.div>
  );
};



// --- SECTION WRAPPER WITH FADE IN ---
const FadeSection = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- JUSTICE PARTICLES COMPONENT ---
const Particle = ({ Icon, top, left, size, factor, mouseX, mouseY }) => {
  const xOffset = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [factor * 80, -factor * 80]);
  const yOffset = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [factor * 80, -factor * 80]);

  const xSpring = useSpring(xOffset, { stiffness: 50, damping: 30 });
  const ySpring = useSpring(yOffset, { stiffness: 50, damping: 30 });

  return (
    <motion.div
      className="absolute text-doj-blue/15 dark:text-white/[0.04] pointer-events-none"
      style={{ top: `${top}%`, left: `${left}%`, x: xSpring, y: ySpring }}
    >
      <motion.div
        animate={{ y: [-15, 15, -15], rotate: [-10, 10, -10] }}
        transition={{ duration: 6 + Math.abs(factor) * 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={size} />
      </motion.div>
    </motion.div>
  );
};

const BackgroundParticles = ({ mouseX, mouseY }) => {
  const particles = [
    { id: 1, Icon: Scale, top: 15, left: 20, size: 50, factor: 0.8 },
    { id: 2, Icon: Brain, top: 40, left: 85, size: 70, factor: -0.6 },
    { id: 3, Icon: FileText, top: 75, left: 10, size: 60, factor: 0.9 },
    { id: 4, Icon: Sparkles, top: 25, left: 70, size: 40, factor: -0.4 },
    { id: 5, Icon: ShieldCheck, top: 60, left: 80, size: 55, factor: 0.7 },
    { id: 6, Icon: Globe, top: 85, left: 30, size: 65, factor: -0.8 },
    { id: 7, Icon: Scale, top: 50, left: 45, size: 40, factor: 0.5 },
    { id: 8, Icon: FileText, top: 10, left: 90, size: 50, factor: -0.7 },
    { id: 9, Icon: Brain, top: 80, left: 60, size: 60, factor: 0.6 },
    { id: 10, Icon: Sparkles, top: 35, left: 10, size: 55, factor: -0.9 },
    { id: 11, Icon: Scale, top: 90, left: 80, size: 45, factor: 0.4 },
    { id: 12, Icon: ShieldCheck, top: 15, left: 50, size: 65, factor: -0.5 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <Particle key={p.id} {...p} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
};

export function LandingPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [titleIndex, setTitleIndex] = useState(0);
  const titles = ["JURIQ", "ज्यूरिक", "జ్యూరిక్", "ಜ್ಯೂರಿಕ್"];

  useEffect(() => {
    const interval = setInterval(() => setTitleIndex((p) => (p + 1) % titles.length), 3000);
    return () => clearInterval(interval);
  }, []);

  // --- MOUSE TRACKING FOR PARTICLES ---
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // --- PARALLAX SCROLLING ---
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]);

  const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } } };
  const itemV = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } };

  const features = [
    { icon: BookOpen, title: "Verified Intelligence", desc: "Advanced RAG pipeline grounded in 850+ official DoJ PDFs, case laws, and the Constitution of India. Zero hallucinations guaranteed.", color: "doj-blue", hoverShadow: "rgb(12,50,94,0.15)" },
    { icon: Globe, title: "Multilingual Support", desc: "Seamless support for English, Hindi (हिंदी), Telugu (తెలుగు), and Kannada (ಕನ್ನಡ) with automatic language detection.", color: "doj-orange", hoverShadow: "rgb(245,130,32,0.15)" },
    { icon: Lock, title: "Enterprise Security", desc: "Multi-step OTP authentication, Google OAuth, encrypted passwords with bcrypt, and automated session protection.", color: "gray-700", hoverShadow: "rgb(0,0,0,0.12)" },
    { icon: Mic, title: "Voice Accessible", desc: "Speak your queries naturally and listen to AI-generated audio answers using Microsoft Edge Neural TTS technology.", color: "purple-600", hoverShadow: "rgb(168,85,247,0.15)" },
  ];

  const techStack = [
    { name: "Llama 3", desc: "Local LLM", icon: Brain },
    { name: "LangChain", desc: "RAG Orchestration", icon: Zap },
    { name: "ChromaDB", desc: "Vector Database", icon: Database },
    { name: "FastAPI", desc: "REST Backend", icon: FileText },
    { name: "React 19", desc: "Frontend UI", icon: MessageSquare },
    { name: "Edge TTS", desc: "Neural Voice", icon: Languages },
  ];

  return (
    <div className="relative w-full overflow-x-hidden bg-doj-bg dark:bg-doj-dark transition-colors duration-500 font-sans" style={{ perspective: "1200px" }}>

      {/* Hide scrollbar */}
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Global Animated Orbs - persist across all sections */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-doj-blue/[0.07] dark:bg-doj-blue/[0.12] rounded-full blur-[150px]"
          animate={{ x: [0, 80, 0], y: [0, 50, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[10%] right-[10%] w-[35rem] h-[35rem] bg-doj-orange/[0.06] dark:bg-doj-orange/[0.10] rounded-full blur-[130px]"
          animate={{ x: [0, -70, 0], y: [0, -60, 0], scale: [1, 1.25, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-[50%] left-[50%] w-[25rem] h-[25rem] bg-purple-500/[0.04] dark:bg-purple-400/[0.08] rounded-full blur-[120px]"
          animate={{ x: [0, 40, -40, 0], y: [0, -50, 50, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      {/* Mouse-Repelling Justice Particles */}
      <BackgroundParticles mouseX={mouseX} mouseY={mouseY} />

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme}
          className="p-3 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 text-gray-800 dark:text-white shadow-lg hover:bg-white/50 dark:hover:bg-black/60 transition-all">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Video BG with Parallax */}
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-15 dark:opacity-25">
            <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-background-27953-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-doj-bg/80 via-doj-bg/90 to-doj-bg dark:from-doj-dark/80 dark:via-doj-dark/90 dark:to-doj-dark" />
        </motion.div>

        {/* Floating 3D symbols */}
        <motion.div className="absolute top-[15%] left-[12%] z-10 hidden lg:block" animate={{ y: [0, -25, 0], rotateZ: [0, 8, -8, 0] }} transition={{ duration: 6, repeat: Infinity }}>
          <Scale className="w-16 h-16 text-doj-blue/15 dark:text-doj-blue/25" />
        </motion.div>
        <motion.div className="absolute bottom-[20%] right-[15%] z-10 hidden lg:block" animate={{ y: [0, 20, 0], rotateZ: [0, -5, 5, 0] }} transition={{ duration: 7, repeat: Infinity }}>
          <ShieldCheck className="w-14 h-14 text-doj-orange/15 dark:text-doj-orange/25" />
        </motion.div>

        {/* Hero Content with Parallax and Centering Fix */}
        <motion.div variants={containerV} initial="hidden" animate="visible" style={{ y: heroY, opacity: heroOpacity }} className="relative z-20 flex flex-col items-center w-full max-w-5xl px-6 text-center">
          {/* Logo */}
          <motion.div variants={itemV} className="mb-6 mt-4">
            <motion.div animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.02, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
              <img src={isDark ? juriqLogo_DarkMode : juriqLogo_WhiteMode} alt="JURIQ Logo" className="w-20 h-20 md:w-32 md:h-32 drop-shadow-2xl" />
            </motion.div>
          </motion.div>

          {/* Multilingual Title — FIXED: Increased container height and added padding to prevent trimming */}
          <motion.div variants={itemV} className="relative w-full max-w-3xl mb-8 flex justify-center" style={{ height: "clamp(8rem, 16vw, 12rem)" }}>
            <AnimatePresence mode="wait">
              <motion.h1
                key={titleIndex}
                initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -25, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight bg-gradient-to-r from-doj-blue via-doj-orange to-doj-blue dark:from-white dark:via-doj-orange dark:to-white bg-clip-text text-transparent px-4 py-8 overflow-visible"
                style={{ backgroundSize: '200% auto', lineHeight: 1.5 }}
              >
                {titles[titleIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>

          {/* Sub-heading */}
          <motion.div variants={itemV} className="max-w-2xl space-y-3 mb-12">
            <p className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Department of Justice AI Assistant</p>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Empowering citizens with instant, accurate, and multilingual legal intelligence — powered by Retrieval-Augmented Generation.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemV} className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button onClick={() => navigate('/auth')} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
              className="group relative px-10 py-4 bg-gradient-to-r from-doj-blue to-blue-700 text-white rounded-full font-bold text-lg shadow-[0_8px_30px_rgb(12,50,94,0.35)] overflow-hidden flex items-center gap-3">
              <span className="relative z-10">Launch JURIQ</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-doj-orange to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            <motion.button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 text-gray-800 dark:text-white rounded-full font-bold text-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all shadow-sm">
              Explore Features
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </section>



      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="relative z-10 w-full py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced <span className="text-doj-orange">Capabilities</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built on a state-of-the-art RAG architecture ensuring zero hallucinations and extreme accuracy from verified government sources.
            </p>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8" style={{ perspective: "800px" }}>
            {features.map((f, i) => (
              <FadeSection key={i}>
                <TiltCard className={`p-8 rounded-[2rem] bg-white/60 dark:bg-doj-dark-secondary/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-300 hover:shadow-[0_8px_40px_${f.hoverShadow}] group`}>
                  <div className={`w-14 h-14 bg-${f.color}/10 dark:bg-${f.color}/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`w-7 h-7 text-${f.color} dark:text-${f.color === 'gray-700' ? 'gray-300' : f.color.replace('600', '400')}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{f.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{f.desc}</p>
                </TiltCard>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="relative z-10 w-full py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It <span className="text-doj-blue dark:text-blue-400">Works</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">From question to verified answer in seconds.</p>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              { num: "1", title: "Ask a Question", desc: "Type or speak your legal query in English, Hindi, Telugu, or Kannada.", color: "doj-blue", glow: "rgba(12,50,94,0.2)" },
              { num: "2", title: "AI RAG Analysis", desc: "LangChain retrieves relevant chunks from 58+ official PDFs via ChromaDB, then Llama 3 generates a grounded answer.", color: "doj-orange", glow: "rgba(245,130,32,0.2)" },
              { num: "3", title: "Get Verified Answers", desc: "Receive cited, accurate responses with options to translate, listen aloud, or provide feedback.", color: "purple-500", glow: "rgba(168,85,247,0.2)" },
            ].map((step, i) => (
              <FadeSection key={i}>
                <motion.div whileHover={{ y: -8 }} className="flex flex-col items-center group">
                  <div className={`w-20 h-20 rounded-[1.5rem] bg-white/70 dark:bg-doj-dark-secondary/70 backdrop-blur-xl shadow-[0_0_25px_${step.glow}] flex items-center justify-center mb-6 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_40px_${step.glow}]`}>
                    <span className={`text-3xl font-black text-${step.color} relative z-10`}>{step.num}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm max-w-xs">{step.desc}</p>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TECH STACK ═══════════════ */}
      <section className="relative z-10 w-full py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Powered By <span className="text-doj-orange">Cutting-Edge</span> Technology
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A robust, production-ready stack combining local AI inference with enterprise-grade security.
            </p>
          </FadeSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {techStack.map((tech, i) => (
              <FadeSection key={i}>
                <motion.div whileHover={{ y: -5, scale: 1.03 }}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white/50 dark:bg-doj-dark-secondary/40 backdrop-blur-xl shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-none transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-doj-blue/10 to-doj-orange/10 dark:from-doj-blue/20 dark:to-doj-orange/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <tech.icon className="w-6 h-6 text-doj-blue dark:text-doj-orange" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{tech.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tech.desc}</p>
                  </div>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="relative z-10 w-full py-24 px-6">
        <FadeSection>
          <div className="max-w-4xl mx-auto text-center py-16 px-8 rounded-[2.5rem] bg-gradient-to-br from-doj-blue to-blue-900 dark:from-doj-dark-secondary dark:to-black relative overflow-hidden shadow-[0_20px_60px_rgba(12,50,94,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            {/* Dot pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/10 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">Ready to access justice?</h2>
              <p className="text-blue-100/80 text-lg mb-10 max-w-xl mx-auto">
                Join citizens across India getting reliable, verified legal information instantly — in their own language.
              </p>
              <motion.button onClick={() => navigate('/auth')} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                className="px-12 py-4 bg-white text-doj-blue rounded-full font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all">
                Get Started Free
              </motion.button>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 w-full py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src={isDark ? juriqLogo_DarkMode : juriqLogo_WhiteMode} alt="JURIQ" className="w-9 h-9" />
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">JURIQ</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">v1.0</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-doj-blue dark:text-doj-orange" /><span className="font-medium">Secure</span></div>
              <div className="flex items-center gap-1.5"><Scale className="w-4 h-4 text-doj-blue dark:text-doj-orange" /><span className="font-medium">Official Sources</span></div>
              <div className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-doj-blue dark:text-doj-orange" /><span className="font-medium">Multilingual</span></div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            &copy; {new Date().getFullYear()} Department of Justice AI Initiative &middot; Built for the citizens of India
          </p>
        </div>
      </footer>
    </div>
  );
}