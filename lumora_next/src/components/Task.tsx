import { motion } from 'framer-motion'
import React from 'react'
import type { Task } from '../app/home/page'
import { createEvent } from 'ics'
import { Calendar, Search, Twitter } from 'lucide-react'
import { SourcesList } from './sourcesList'

export default function Task({
    id,
    title,
    desc,
    tag,
    misc,
}: Task) {
    const downloadCalendarInvite = (title: string, description: string) => {    
        const event = {
            // TODO: fix once thor fixes format
            start: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate(), 10, 0] as [number, number, number, number, number], // Default to today at 10 AM
            duration: { hours: Math.floor(misc.duration/60), minutes: misc.duration % 60 },
            title: title,
            description: description,
            status: 'CONFIRMED' as const,
        }
    
        createEvent(event, (error: any, value: string) => {
            if (error) {
                console.log(error)
                return
            }
    
            const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${title}.ics`)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
            window.URL.revokeObjectURL(url)
        })
    }

    const getTagColor = (tag: string) => {
        switch (tag.toLowerCase()) {
        case "meeting":
            return "bg-blue-900 text-blue-200 border border-blue-700"
        case "report":
            return "bg-green-900 text-green-200 border border-green-700"
        case "education":
            return "bg-yellow-900 text-yellow-200 border border-yellow-700"
        case "quiz":
            return "bg-purple-900 text-purple-200 border border-purple-700"
        case "flashcards":
            return "bg-pink-900 text-pink-200 border border-pink-700"
        case "twitter":
            return "bg-sky-900 text-sky-200 border border-sky-700"
        case "timeline":
            return "bg-orange-900 text-orange-200 border border-orange-700"
        case "research":
            return "bg-indigo-900 text-indigo-200 border border-indigo-700"
        default:
            return "bg-gray-800 text-gray-200 border border-gray-700"
        }
    }

    return (
        <motion.div
            key={id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full bg-gray-800 p-6 rounded-lg shadow-lg relative accent-border mb-4"
            onClick={() => {} }
        >
            <span
                className={`absolute top-4 right-4 text-xs font-light px-2.5 py-0.5 rounded-full ${getTagColor(tag)}`}
            >
                {tag}
            </span>
            <h3 className="text-xl font-light mb-2 text-gray-200">{title}</h3>
            <p className="text-sm text-gray-400 mt-2">{desc}</p>
            {
                tag === "meeting" && (
                    <div 
                        className="flex w-fit items-center mt-4 border border-gray-700 p-2 rounded-lg hover:cursor-pointer"
                        onClick={() => downloadCalendarInvite(title, desc)}
                    >
                        <Calendar className="w-5 h-5 mr-2" />
                        <p className="text-xs text-gray-400">Add to Calendar</p>
                    </div>
                )
            }
            {
                tag === "twitter" && (
                    <div 
                        className="flex w-fit items-center mt-4 border border-gray-700 p-2 rounded-lg hover:cursor-pointer"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${misc.tweet}`)}
                    >
                        <Twitter className="w-5 h-5 mr-2" />
                        <p className="text-xs text-gray-400">Post on Twitter</p>
                    </div>
                )
            }
            {
                tag === "flashcards" && (
                    <div 
                        className="flex w-fit items-center mt-4 border border-gray-700 p-2 rounded-lg hover:cursor-pointer"
                        onClick={() => window.open("https://quizlet.com")}
                    >
                        <p className="text-xs text-gray-400">Open Lumora Flashboard</p>
                    </div>
                )
            }
            {
                tag === "quiz" && (
                    <div 
                        className="flex w-fit items-center mt-4 border border-gray-700 p-2 rounded-lg hover:cursor-pointer"
                        onClick={() => {}}
                    >
                        <p className="text-xs text-gray-400">Open Lumora Quiz</p>
                    </div>
                )
            }
            {
                tag === "research" && misc.researchResults && (
                    <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 border-t border-gray-700 pt-4"
                    >
                    <div className="flex items-center mb-2">
                        <Search className="w-5 h-5 mr-2 text-indigo-400" />
                        <h4 className="text-lg font-medium text-gray-300">Research Results</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{misc.researchResults.summary}</p>
                    <SourcesList sources={misc.researchResults.sources} />
                    </motion.div>
                )
            }
        </motion.div>
    )
}
