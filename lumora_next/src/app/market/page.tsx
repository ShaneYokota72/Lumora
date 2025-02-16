'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Search, BookOpen, Edit3, Twitter, CheckSquare, ArrowLeft, Rocket, ListTodo } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function MarketplacePage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<{
    id: number
    agent_task: string
    agent_display_name: string
    agent_description: string
  }[]>([])

  const [userAgent, setUserAgent] = useState<string[]>([])

  const getIcon = (agentTask: string) => {
    switch (agentTask) {
      case 'meeting':
        return <Calendar className="w-8 h-8 mb-4 text-purple-400" />
      case 'research':
        return <Search className="w-8 h-8 mb-4 text-purple-400" />
      case 'timeline':
        return <BookOpen className="w-8 h-8 mb-4 text-purple-400" />
      case 'temp':
        return <Edit3 className="w-8 h-8 mb-4 text-purple-400" />
      case 'twitter':
        return <Twitter className="w-8 h-8 mb-4 text-purple-400" />
      case 'flashcards':
      case 'quiz':
        return <CheckSquare className="w-8 h-8 mb-4 text-purple-400" />
      case 'todo':
        return <ListTodo className="w-8 h-8 mb-4 text-purple-400" />
      default:
        return <Rocket className="w-8 h-8 mb-4 text-purple-400" />
    }
  }

  const toggleAgent = async (id: number, add: boolean) => {
    const res = await fetch(`/api/agent/${user?.userEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, add }),
    });

    if (res.ok) {
      if (!add) {
        setUserAgent(userAgent.filter((agentId) => agentId !== id.toString()));
      } else {
        setUserAgent([...userAgent, id.toString()]);
      }
    } else {
      console.error('Failed to update agent');
    }
  }

  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch("/api/agent")
      const data = await res.json()
      console.log(data)
      setAgents(data)
    }
    const fetchUserAgent = async () => {
      const res = await fetch(`/api/agent/${user?.userEmail}`)
      const data = await res.json()
      console.log(data)
      setUserAgent(data)
    }

    fetchAgents()
    fetchUserAgent()
  }, [])

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
            {getIcon(agent.agent_task)}
            <h2 className="text-xl font-light mb-2 text-gray-200">{agent.agent_display_name}</h2>
            <p className="text-gray-400 mb-4 text-sm font-light">{agent.agent_description}</p>
            {userAgent.filter((id) => Number(id) === agent.id).length > 0 ? (
              <button 
                className="bg-white hover:bg-slate-100 text-black font-light py-2 px-4 rounded-md transition duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                onClick={ () => toggleAgent(agent.id, false) }
              >
                Remove from Workspace
              </button>
            ) : (
              <button 
                className="bg-purple-600 hover:bg-purple-700 text-white font-light py-2 px-4 rounded-md transition duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                onClick={ () => toggleAgent(agent.id, true) }
              >
                Add to Workspace
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

