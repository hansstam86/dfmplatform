import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const pkg = body.package || 'ai'

    const { data: profile } = await supabase
      .from('profiles')
      .select('package, prd_credit')
      .eq('id', user.id)
      .single()

    const isUpgrade = pkg === 'ai' && profile?.package === 'prd'

    let priceId: string

    if (pkg === 'prd') {
      priceId = process.env.STRIPE_PRICE_ID_PRD!
    } else if (isUpgrade) {
      // €49 - €9.90 = €39.10 credit for PRD users upgrading
      const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: 3910,
        product_data: { name: 'DFM Insights — AI Package (PRD Credit Applied)' },
      })
      priceId = price.id
    } else {
      priceId = process.env.STRIPE_PRICE_ID_AI!
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: { user_id: user.id, package: pkg, is_upgrade: isUpgrade ? 'true' : 'false' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dfmplatform.vercel.app'}/dashboard?paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dfmplatform.vercel.app'}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
