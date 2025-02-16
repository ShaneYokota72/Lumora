import { NextResponse } from 'next/server';
import { Database } from '../../../../../database.types'
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server'

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_LINK!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
    const param = await params;
    try {
        if (!param.email) {
            return NextResponse.json({ error: 'email is required' }, { status: 400 });
        }

        const { email } = param;
        if (!email) {
            throw new Error('Invalid request data');
        }

        const { data, error: userError } = await supabase
            .from('User')
            .select('agent_options')
            .eq('email', email as string)
        if (userError) {
            throw new Error(userError.message);
        }

        return NextResponse.json(data[0].agent_options);
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
    const param = await params;
    try {
        const { id, add } = await req.json();
        if (!param.email || !id || add === undefined) {
            return NextResponse.json({ error: 'parameter are missing' }, { status: 400 });
        }

        const { email } = param;

        const { data: agent_options, error } = await supabase
            .from('User')
            .select('agent_options')
            .eq('email', email as string)

        if (error) {
            throw new Error(error.message);
        }

        let updatedAgentOptions = agent_options[0].agent_options || [];

        if (add) {
            updatedAgentOptions.push(id);
        } else {
            updatedAgentOptions = updatedAgentOptions.filter((optionId) => optionId !== id);
        }

        const { error: updateError } = await supabase
            .from('User')
            .update({ agent_options: updatedAgentOptions })
            .eq('email', email as string)

        if (updateError) {
            throw new Error(updateError.message);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
}