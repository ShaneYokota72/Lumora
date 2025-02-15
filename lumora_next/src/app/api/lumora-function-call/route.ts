import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // Validating request data
        const { 
            messageType, 
            data,
            from,
            to,
        } = await req.json();
        console.log('messageType:', messageType);
        console.log('data:', data);
        console.log('from:', from);
        console.log('to:', to);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}