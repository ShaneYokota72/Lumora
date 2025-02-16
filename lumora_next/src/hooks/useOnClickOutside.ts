import React, { useEffect } from 'react';

export function useOnClickOutside(
    ref: React.RefObject<any>,
    callback: () => void
) {
    useEffect(() => {
        const listener = (event: TouchEvent | MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, callback]);
}
