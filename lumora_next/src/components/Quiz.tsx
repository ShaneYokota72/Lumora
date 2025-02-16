import React from 'react'

interface Quiz {
    quiz: string[]
}
export default function Quiz({
    quiz
}: Quiz) {
    return (
        <>
            <p className='text-lg mb-4 text-white'>Question to respond to</p>
            <div className="w-96 flex flex-col items-center gap-4">
                {quiz.map((question, index) => (
                    <div key={index} className="p-2 bg-gray-200 rounded shadow-md w-full">
                        {question}
                    </div>
                ))}
            </div>
        </>
    )
}