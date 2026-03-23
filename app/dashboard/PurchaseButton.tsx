'use client'
import { useState } from 'react'

export default function PurchaseButton() {
  const [loading, setLoading] = useState(false)

  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      style={{
        background: 'var(--amber)', color: 'var(--ink)',
        padding: '12px 24px', borderRadius: '8px',
        fontSize: '14px', fontWeight: 700, border: 'none',
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        opacity: loading ? 0.7 : 1, transition: 'opacity .2s'
      }}
    >
      {loading ? 'Redirecting…' : '⚡ Purchase AI Package — €499'}
    </button>
  )
}
