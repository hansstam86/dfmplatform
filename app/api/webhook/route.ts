import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

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
    // Default to 'ai' — founding member Stripe link has no metadata
    const pkg = session.metadata?.package || 'ai'
    const isUpgrade = session.metadata?.is_upgrade === 'true'

    if (userId) {
      const updateData: any = {
        id: userId,
        email: session.customer_email,
        paid: true,
        stripe_customer_id: session.customer as string,
        stripe_session_id: session.id,
        paid_at: new Date().toISOString(),
        package: pkg,
      }

      // If PRD package — set prd_credit true, limit to 1 project
      if (pkg === 'prd') {
        updateData.prd_credit = true
        updateData.ecr_used = 0
      }

      // If AI upgrade — keep prd_credit, upgrade package
      if (isUpgrade) {
        updateData.prd_credit = true
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert(updateData)

      if (error) {
        console.error('Supabase update error:', error)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log(`Payment confirmed: user=${userId} package=${pkg} upgrade=${isUpgrade}`)
    }
  }

  return NextResponse.json({ received: true })
}
