import { ArrowRight } from 'lucide-react';
import React, {useState} from 'react'

interface Flashcard {
    front: string
    back: string
}
interface FlashcardList {
    flashcardList: Flashcard[]
}

export default function Flashcards({
    flashcardList
}: FlashcardList) {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleCardClick = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNextCard = () => {
        setIsFlipped(false);
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcardList.length);
    };

    return (
        <div className="w-96 flex flex-col items-center gap-4">
            <div
                onClick={handleCardClick}
                className="w-full min-h-[16rem] cursor-pointer transition-all duration-300 hover:shadow-lg bg-slate-900 border-slate-800 rounded-lg"
            >
                <div className="h-full w-full flex flex-col items-center justify-center p-8 gap-4">
                    <p className='text-xl font-medium text-center text-slate-400'>{isFlipped ? 'Question:' : 'Answer:'}</p>
                    <p className="text-xl font-medium text-center text-slate-100">
                        {isFlipped ? flashcardList[currentCardIndex].back : flashcardList[currentCardIndex].front}
                    </p>
                </div>
            </div>
            <button onClick={handleNextCard} className="bg-purple-600 hover:bg-purple-700 text-white flex gap-2 p-3 rounded-md">
                <p>{currentCardIndex+1}/{flashcardList.length}</p>
                <ArrowRight className="h-4 w-4 my-auto" />
            </button>
        </div>
    );
}
