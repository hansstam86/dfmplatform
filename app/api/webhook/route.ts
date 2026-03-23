import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

// Use service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id

    if (userId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: session.customer_email,
          paid: true,
          stripe_customer_id: session.customer as string,
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
          package: session.metadata?.package || 'ai',
        })

      if (error) {
        console.error('Supabase update error:', error)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log(`✅ Payment confirmed for user ${userId}`)
    }
  }

  return NextResponse.json({ received: true })
}

// Required for Stripe webhook — disable body parsing
export const config = { api: { bodyParser: false } }
