import { NextRequest, NextResponse } from 'next/server';
import { processZoomEvent } from '../../../utils/Agent/GroqFunctionCall';
import { EventData, ToolTag } from '../../../utils/Agent/types';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../../database.types';

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_LINK!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

        const {data: agent_options, error} = await supabase
            .from('User')
            .select('agent_options')
            .eq('email', from);
        if(agent_options === null || agent_options.length === 0) {
            return NextResponse.json({ success: true, message: 'No agent options found' });
        }

        const {data: agent_options_supa, error: agentOptionsError} = await supabase
            .from('Agent')
            .select('agent_task')
            .in('id', agent_options[0].agent_options ?? []);
        if(agent_options_supa === null || agent_options_supa.length === 0) {
            return NextResponse.json({ success: true, message: 'No agent options found'  });
        }

        const enabledTools = agent_options_supa?.map((agentOption) => agentOption.agent_task) ?? [];

        const response = await processZoomEvent(eventData, enabledTools as ToolTag[]);
        const dbResponse = await fetch(new URL('/api/save', process.env.NEXT_PUBLIC_BASE_URL).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response),
        });

        if (!dbResponse.ok) {
            throw new Error('Failed to save to database');
        }
        
        console.log('response:', response);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}