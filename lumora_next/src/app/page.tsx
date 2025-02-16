'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { Rocket, Zap, Cog } from "lucide-react"
// import dynamic from "next/dynamic"

// const ParticleBackground = dynamic(() => import("../components/ParticleBackground.tsx"), { ssr: false })

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-8 relative overflow-hidden">
      {/* <ParticleBackground /> */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10"
      >
        <h1 className="text-5xl font-light mb-4 text-gray-100">
          Welcome to <span className="accent-text font-normal">Lumora</span>
        </h1>
        <p className="text-xl mb-8 text-gray-300 font-light">Your AI-Powered Collaboration Hub</p>
        <Link
          href="/home"
          className="bg-purple-600 hover:bg-purple-700 text-white font-light py-2 px-6 rounded-md transition duration-300 shadow-lg hover:shadow-xl"
        >
          Get Started
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 z-10"
      >
        <FeatureCard
          icon={<Rocket className="w-6 h-6 mb-4 text-purple-400" />}
          title="AI Agents"
          description="Automate tasks with intelligent agents"
        />
        <FeatureCard
          icon={<Zap className="w-6 h-6 mb-4 text-purple-400" />}
          title="Zoom Integration"
          description="Transform meetings into actionable workflows"
        />
        <FeatureCard
          icon={<Cog className="w-6 h-6 mb-4 text-purple-400" />}
          title="Customizable"
          description="Tailor agents to your specific needs"
        />
      </motion.div>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 bg-opacity-50 p-6 rounded-lg accent-border shadow-lg backdrop-blur-sm"
    >
      {icon}
      <h2 className="text-xl font-light mb-2 text-gray-200">{title}</h2>
      <p className="text-gray-400 text-sm font-light">{description}</p>
    </motion.div>
  )
}

