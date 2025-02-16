'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, Circle, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import Task from "@/components/Task"

export interface Task {
    id: number
    title: string
    desc: string
    tag: string
    misc: any
}
interface Todo {
    id: number
    task: string
    completed: boolean
}

export default function HomePage() {
    const { user } = useAuth();
    const [completedTasks, setCompletedTasks] = useState<Task[]>([])
    const [todoTasks, setTodoTasks] = useState<Todo[]>([])

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

    const toggleTask = async (todo: Todo) => {
        const res = await fetch(`/api/todos`, {
            method: "POST",
            body: JSON.stringify({
                id: todo.id,
                completed: !todo.completed
            })
        })
        return res.ok
    }
    
    return (
        <div className="min-h-screen flex flex-col items-center">
            <div className="flex w-full justify-between items-center p-4">
                <p className="text-2xl">💡 Lumora</p>
                <Link
                href="/market"
                className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-300"
                >
                <ShoppingBag className="w-5 h-5 mr-2" />
                <span className="font-medium">Marketplace</span>
                </Link>
            </div>
            <div className="mb-4 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-semibold text-gray-100 mb-4 tracking-wide text-center leading-[68px]"
                >
                    Welcome back, 
                    <br/>
                    <span className="text-purple-400 font-bold text-6xl">{user?.displayName}</span>
                </motion.h1>
            </div>
            <div className="grid grid-cols-3 py-8 mx-96 gap-12">
                <div className="col-span-2">
                    <h2 className="text-3xl font-medium mb-2 text-gray-300">Completed Tasks</h2>
                    {completedTasks.length && completedTasks.map((task) => (
                        <Task key={task.id} id={task.id} title={task.title} desc={task.desc} tag={task.tag} misc={task.misc}/>
                    ))}
                </div>

                <div className="col-span-1">
                    <h2 className="text-3xl font-medium mb-2 text-gray-300">Todo</h2>
                    {todoTasks.length && todoTasks.map((task) => (
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

