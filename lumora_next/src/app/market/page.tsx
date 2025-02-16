'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Search, BookOpen, Edit3, Twitter, CheckSquare, ArrowLeft } from "lucide-react"

export default function MarketplacePage() {
  const agents = [
    { id: 1, name: "Meeting Scheduler", description: "Automate your meeting scheduling process", icon: Calendar },
    { id: 2, name: "Research Assistant", description: "Find relevant documents and answers quickly", icon: Search },
    { id: 3, name: "Quiz Generator", description: "Create interactive quizzes from your content", icon: BookOpen },
    { id: 4, name: "Flashcard Creator", description: "Generate study flashcards automatically", icon: Edit3 },
    { id: 5, name: "Tweet Drafter", description: "Craft engaging tweets for your marketing needs", icon: Twitter },
    { id: 6, name: "Task Manager", description: "Organize and prioritize your tasks efficiently", icon: CheckSquare },
  ]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-light text-gray-100"
        >
          AI Agent Marketplace
        </motion.h1>
        <Link
          href="/home"
          className="flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-light">Back to Home</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg relative overflow-hidden group accent-border"
          >
            <agent.icon className="w-8 h-8 mb-4 text-purple-400" />
            <h2 className="text-xl font-light mb-2 text-gray-200">{agent.name}</h2>
            <p className="text-gray-400 mb-4 text-sm font-light">{agent.description}</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-light py-2 px-4 rounded-md transition duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50">
              Add to Workspace
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

