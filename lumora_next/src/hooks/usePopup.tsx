'use client'

import Popup from "@/components/Popup";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

interface PopupContextType {
    setPopupContent: (content: React.ReactNode, onClose?: () => void) => void
    closePopup: () => void
    isPopupOpen: boolean
    popupContent: React.ReactNode | null
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

interface ProvidePopupProps {
    children: React.ReactNode
}
export function ProvidePopup({ children } : ProvidePopupProps ) {
    // const {
    //     setPopupContent,
    //     closePopup,
    //     isPopupOpen,
    //     popupContent
    // } = useProvidePopup()
    const popup = useProvidePopup()
    const {
        isPopupOpen,
        popupContent,
        closePopup
    } = popup

    return (
        <PopupContext.Provider value={popup}>
            <Popup open={isPopupOpen} onClose={closePopup}>
                {popupContent}
            </Popup>
            {children}
        </PopupContext.Provider>
    )
}

function useProvidePopup(){
    const [popupContent, _setPopupContent] = useState<React.ReactNode | null>(null)
    const [popupOpen, setPopupOpen] = useState<boolean>(false)
    const [popupOnClose, setPopupOnClose] = useState<() => void>(() => {})

    const setPopupContent = (content: ReactNode, onClose = () => {}) => {
        _setPopupContent(content)
        setPopupOpen(true)
        setPopupOnClose(onClose)
    }

    const closePopup = () => {
        if(popupOpen) popupOnClose?.()
        setPopupOpen(false)
    }

    const isPopupOpen = popupOpen && Boolean(popupContent)

    return {
        setPopupContent,
        closePopup,
        isPopupOpen,
        popupContent
    }
}

export const usePopup = () => {
    const context = useContext(PopupContext)
    if (context === undefined) {
        throw new Error('usePopup must be used within a ProvidePopup')
    }
    return context
}