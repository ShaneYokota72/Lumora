type MediaType = "TRANSCRIPT" | "CHAT"

export interface EventData{
    messageType: MediaType 
    data: string
    from: string
    to: string
    timestamp: Date
}

