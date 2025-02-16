'use client'

import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import React from 'react'
import clsx from 'clsx'

interface PopupProps {
    children: React.ReactNode
    onClose: () => void
    open: boolean
}

export default function Popup({
    children,
    onClose,
    open,
}: PopupProps) {
    const popupRef = React.useRef<HTMLDivElement>(null)
    useOnClickOutside(popupRef, open ? onClose : ()=>{})

    return (
        open && (
            <div className='fixed top-0 left-0 z-50 w-full h-full flex items-center justify-center bg-transparent'>
                <div
                    className={clsx('rounded-2xl border accent-border px-10 py-6 bg-gray-800', {"hidden": !open})}
                    ref={popupRef}
                >
                    {children}
                </div>
            </div>
        )
    )
}
