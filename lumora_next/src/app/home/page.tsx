'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, Circle, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function HomePage() {
    const { user } = useAuth();
    const [completedTasks, setCompletedTasks] = useState([
        {
            id: 1,
            title: "Scheduled team meeting",
            tag: "Meeting",
            desc: "Coordinated with team members to find a suitable time slot. Sent out calendar invites with agenda items and relevant documents attached.",
        },
        {
            id: 2,
            title: "Generated project summary",
            tag: "Report",
            desc: "Compiled key project metrics and milestones achieved. Created a concise document highlighting progress, challenges, and next steps for stakeholders.",
        },
        {
            id: 3,
            title: "Created flashcards for Biology",
            tag: "Education",
            desc: "Developed a set of digital flashcards covering key concepts in cellular biology. Included visual aids and mnemonic devices to enhance retention.",
        },
    ])

    const [todoTasks, setTodoTasks] = useState([
        { id: 1, task: "Finish homework1 by tomorrow 11:59", completed: false },
        { id: 2, task: "Review meeting notes", completed: false },
        { id: 3, task: "Prepare presentation slides", completed: false },
    ])

    useEffect(() => {
        const fetchData = async () => {
            const res1 = await fetch(`/api/tasks/${user?.userEmail}`)
            const tasks = await res1.json()

            const res2 = await fetch(`/api/todos/${user?.userEmail}`)
            const todos = await res2.json()

            setCompletedTasks(tasks)
            setTodoTasks(todos)
        }   
        fetchData()
    }, [])

    interface Task {
        id: number
        task: string
        completed: boolean
    }
    const toggleTask = async (todo: Task) => {
        const res = await fetch(`/api/todos`, {
            method: "POST",
            body: JSON.stringify({
                id: todo.id,
                completed: !todo.completed
            })
        })
        return res.ok
    }

    const getTagColor = (tag: string) => {
        switch (tag.toLowerCase()) {
        case "meeting":
            return "bg-blue-900 text-blue-200 border border-blue-700"
        case "report":
            return "bg-green-900 text-green-200 border border-green-700"
        case "education":
            return "bg-yellow-900 text-yellow-200 border border-yellow-700"
        default:
            return "bg-gray-800 text-gray-200 border border-gray-700"
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center">
            <div className="flex w-full justify-between items-center p-4">
                <p>Lumora</p>
                <Link
                href="/market"
                className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-300"
                >
                <ShoppingBag className="w-5 h-5 mr-2" />
                <span className="font-medium">Marketplace</span>
                </Link>
            </div>
            <div className="mb-4text-center">
                <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-semibold text-gray-100 mb-4 tracking-wide"
            >
                Welcome back, <span className="text-purple-400 font-bold">{user?.displayName}</span>
                </motion.h1>
            </div>
            <div className="grid grid-cols-3 py-8 mx-96 gap-12">
                    <div className="col-span-2">
                        <h2 className="text-3xl font-medium mb-2 text-gray-300">Completed Tasks</h2>
                        {completedTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full bg-gray-800 p-6 rounded-lg shadow-lg relative accent-border mb-4"
                            >
                                <span
                                className={`absolute top-4 right-4 text-xs font-light px-2.5 py-0.5 rounded-full ${getTagColor(task.tag)}`}
                                >
                                {task.tag}
                                </span>
                                <h3 className="text-xl font-light mb-2 text-gray-200">{task.title}</h3>
                                <p className="text-sm text-gray-400 mt-2">{task.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="col-span-1">
                        <h2 className="text-3xl font-medium mb-2 text-gray-300">Todo</h2>
                        {todoTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full flex items-center bg-gray-800 p-4 rounded-lg shadow-lg mb-4 accent-border"
                                onClick={async () => {
                                    setTodoTasks((prevTasks) =>
                                        prevTasks.map((prevTask) => prevTask.id === task.id
                                            ? { ...prevTask, completed: !prevTask.completed }
                                            : prevTask
                                        )
                                    )
                                    if(!(await toggleTask(task))){
                                        setTodoTasks((prevTasks) =>
                                            prevTasks.map((prevTask) => prevTask.id === task.id
                                                ? { ...prevTask, completed: !prevTask.completed }
                                                : prevTask
                                            )
                                        )
                                    }
                                }}
                            >
                                {task.completed ? (
                                    <CheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                                ) : (
                                    <Circle className="text-gray-500 mr-2 flex-shrink-0" />
                                )}
                                <span className={`${task.completed ? "line-through text-gray-500" : "text-gray-200"} font-light`}>
                                    {task.task}
                                </span>
                            </motion.div>
                        ))}
                    </div>
            </div>
        </div>
    )
}

