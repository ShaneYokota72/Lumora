'use client'

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../database.types'

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_LINK!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface userType {
    _id: string
    userEmail: string
    displayName: string
}

interface AuthContextType {
    user: userType | null
    updateUser: (newUser: Partial<userType>) => void
    login: (userEmail: string, password: string, remember?: boolean) => Promise<userType | null>
    logout: () => void
    signup: (userEmail: string, password: string, displayName: string) => Promise<userType | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ProvideAuthProps {
    children: React.ReactNode
}
export function ProvideAuth({ children } : ProvideAuthProps ) {
    const auth = useProvideAuth()
    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}

function useProvideAuth() {
    // start as a dummy user for the sake of demo
    const [user, setUser] = useState<userType | null>({
        _id: "",
        userEmail: "shin20040720@gmail.com",
        displayName: "Shane"
    })

    // useEffect(() => {
    //     const getUser = async () => {
    //         try {
    //             const response = await fetch('/api/auth/me',{
    //                 method: 'GET',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 credentials: 'include'
    //             })
    //             const data = await response.json()
    //             if (response.ok) {
    //                 setUser(data.user)
    //             } else {
    //                 console.error("Error getting user", data)
    //             }
    //         } catch (error) {
    //             console.error("Error getting user", error)
    //         }
    //     }
    //     getUser()
    // }, [])
    
    const updateUser = async (newUser: Partial<userType>) => {
        try {
            const response = await fetch('/api/auth/update', {
                method: 'POST',
                body: JSON.stringify({newUser, _id: user?._id}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (response.ok) {
                setUser(data.newUser)
                return data.newUser
            } else {
                console.error("Error updating user", data)
                return null
            }
        } catch (error) {
            console.error("Error updating user", error)
            return null
        }
    }

    const signup = async (userEmail: string, password: string, displayName: string) => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ userEmail, password, displayName }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                return data.user
            } else {
                console.error("Error signing up", data)
                return null
            }
        } catch (error) {
            console.error("Error signing up", error)
            return null
        }
    }
    
    const login = async (userEmail: string, password: string, remember?: boolean) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ userEmail, password, remember }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                return data.user
            } else {
                return null
            }
        } catch (error) {
            console.error("Error logging in", error)
            return null
        }
    }
    
    const logout = () => {
        console.log("logout logic")
    }
    
    return {
        user,
        updateUser,
        signup,
        login,
        logout
    }
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a ProvideAuth");
    }
    return context;
}