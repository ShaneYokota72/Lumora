import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../../database.types'
import { NextRequest, NextResponse } from 'next/server';

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_LINK!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
    try {
        // Validating request data
        const body: { user_email?: string; title?: string; desc?: string; tag?: string; misc?: string; task?: string; due_date?: string; priority?: string; action?: string } = await req.json();
        console.log('body:', body);
        
        if ('title' in body && 'desc' in body && 'tag' in body && 'misc' in body) {
            const { user_email, title, desc, tag, misc } = body;
            const { data, error } = await supabase
                .from('Task')
                .insert({ user_email, title, desc, tag, misc })
                .select()
            if(error) {
                throw new Error(error.message);
            }

            console.log('data:', data);
        } else if ('task' in body && 'due_date' in body && 'priority' in body) {
            const { user_email, task, due_date, priority } = body;
            const { data, error } = await supabase
                .from('Todo')
                .insert({ user_email, task, due_date, priority })
                .select()
            if(error) {
                throw new Error(error.message);
            }

            console.log('data:', data);
        } else if('action' in body && body.action === 'no_action_needed'){
            console.log('No action needed')
        } else {
            throw new Error('Invalid request data');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}