import { NextRequest, NextResponse } from 'next/server';
import { processZoomEvent } from '../../../utils/Agent/GroqFunctionCall';
import { EventData } from '../../../utils/Agent/types';

export async function POST(req: NextRequest) {
    try {
        // Validating request data
        const { 
            messageType, 
            data,
            from,
            to,
            timestamp,
        } = await req.json();
        console.log('messageType:', messageType);
        console.log('data:', data);
        console.log('from:', from);
        console.log('to:', to);

        // Calling function
        const eventData: EventData = {
            messageType,
            data,
            from,
            to,
            timestamp,
        };

        type ToolTag = "meeting" | "todo" | "quiz" | "flashcards" | "twitter" | "timeline";

        const enabledTools: ToolTag[] = ["meeting", "todo", "quiz", "flashcards", "twitter", "timeline"];
        const response = await processZoomEvent(eventData, enabledTools);
        console.log('response:', response);
        

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}