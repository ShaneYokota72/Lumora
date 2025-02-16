type MediaType = "TRANSCRIPT" | "CHAT"

export type ToolTag = "meeting" | "todo" | "quiz" | "flashcards" | "twitter" | "timeline" | "research";

export interface EventData{
    messageType: MediaType 
    data: string
    from: string
    to: string
    timestamp: Date
}

