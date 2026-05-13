import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api'

export default function OTPPanel({ token, phone, expiresAt, onVerified }) {
  const inputsRef = useRef([])
  const [values, setValues] = useState(['','','','','',''])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [expired, setExpired] = useState(false)
  const [resending, setResending] = useState(false)

  const calcRemaining = useCallback(() => {
    if (!expiresAt) return 120
    return Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
  }, [expiresAt])

  const startTimer = useCallback(() => {
    const secs = calcRemaining()
    setCountdown(secs)
    setExpired(secs <= 0)
  }, [calcRemaining])

  useEffect(() => { startTimer() }, [startTimer])

  useEffect(() => {
    if (countdown <= 0) { setExpired(true); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => { inputsRef.current[0]?.focus() }, [])

  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[idx] = digit
    setValues(next)
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !values[idx] && idx > 0)
      inputsRef.current[idx - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...values]
    text.split('').forEach((ch, i) => { next[i] = ch })
    setValues(next)
    inputsRef.current[Math.min(text.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    setMsg(null)
    const otp = values.join('')
    if (otp.length !== 6) return setMsg({ text: 'Please enter all 6 digits.', type: 'error' })
    setLoading(true)
    try {
      await api('/verify/verify-otp', 'POST', { phone, otp }, token)
      onVerified()
    } catch (err) {
      setMsg({ text: err.message || 'An unknown error occurred', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api('/verify/send-otp', 'POST', { phone }, token)
      setValues(['','','','','',''])
      startTimer()
      setMsg({ text: '✓ New code sent!', type: 'success' })
      inputsRef.current[0]?.focus()
    } catch (err) {
      setMsg({ text: err.message || 'Failed to resend. Try again.', type: 'error' })
    } finally {
      setResending(false)
    }
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="fade-in">
      <h1>Enter the code</h1>
      <p className="subtitle">We sent a 6-digit code to {phone}.</p>
      <div className="otp-group">
        {values.map((v, i) => (
          <input key={i} type="text" className="otp-digit" maxLength="1"
                 pattern="\d" inputMode="numeric" value={v}
                 ref={el => inputsRef.current[i] = el}
                 onChange={e => handleChange(i, e.target.value)}
                 onKeyDown={e => handleKeyDown(i, e)}
                 onPaste={i === 0 ? handlePaste : undefined} />
        ))}
      </div>
      {!expired && (
        <div className="timer">Code expires in <span>{fmt(countdown)}</span></div>
      )}
      {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
      <button className={`btn-primary${loading ? ' loading' : ''}`} disabled={loading} onClick={handleVerify}>
        Verify code
      </button>
      <button className="btn-ghost" disabled={!expired || resending} onClick={handleResend}>
        {resending ? 'Sending...' : 'Resend code'}
      </button>
    </div>
  )
}
