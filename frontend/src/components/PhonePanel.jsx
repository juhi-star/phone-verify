import { useState } from 'react'
import { api } from '../api'

export default function PhonePanel({ token, onPhoneSubmitted }) {
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setMsg(null)
    if (!phone) return setMsg({ text: 'Please enter your phone number.', type: 'error' })
    if (!/^\+[1-9]\d{6,14}$/.test(phone))
      return setMsg({ text: 'Use E.164 format, e.g. +14155552671', type: 'error' })
    setLoading(true)
    try {
      const res = await api('/verify/send-otp', 'POST', { phone }, token)
      onPhoneSubmitted(phone, res.data?.expiresAt)
    } catch (err) {
      setMsg({ text: err.message || 'An unknown error occurred', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h1>Verify your phone</h1>
      <p className="subtitle">Enter your number in international format. We'll send a 6-digit code.</p>
      <div className="form-group">
        <label>Phone number (E.164 format)</label>
        <input type="tel" placeholder="+14155552671" autoComplete="tel"
               value={phone} onChange={e => setPhone(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()} />
      </div>
      {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      <button className={`btn-primary${loading ? ' loading' : ''}`} disabled={loading} onClick={handleSend}>
        Send verification code
      </button>
    </div>
  )
}
