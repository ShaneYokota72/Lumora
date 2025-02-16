import { NextResponse } from 'next/server';
import { Database } from '../../../../database.types'
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server'

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_LINK!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const { 
            id,
            completed,
        } = await req.json();

        if (id === undefined || id === null || completed === undefined || completed === null) {
            throw new Error('Invalid request data');
        }

        const { data, error } = await supabase
            .from('Todo')
            .update({ completed: completed })
            .eq('id', id)
        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}