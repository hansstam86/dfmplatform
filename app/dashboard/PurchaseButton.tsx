'use client'
import { useState } from 'react'

export default function PurchaseButton({ pkg = 'ai', label }: { pkg?: string, label?: string }) {
  const [loading, setLoading] = useState(false)

  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const defaultLabel = pkg === 'prd' ? '📄 Get PRD Generator — €9.90' : '⚡ Get AI Package — €49'

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      style={{
        background: pkg === 'prd' ? 'var(--white)' : 'var(--amber)',
        color: pkg === 'prd' ? 'var(--ink)' : 'var(--ink)',
        border: pkg === 'prd' ? '1px solid var(--border)' : 'none',
        padding: '12px 24px', borderRadius: '8px',
        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        whiteSpace: 'nowrap' as const, flexShrink: 0,
        opacity: loading ? 0.7 : 1, transition: 'opacity .2s'
      }}
    >
      {loading ? 'Redirecting…' : (label || defaultLabel)}
    </button>
  )
}
