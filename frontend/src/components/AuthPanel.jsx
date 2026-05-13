import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AuthPanel({ onAuth, goToSignIn }) {
  const [isLogin, setIsLogin] = useState(goToSignIn)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setIsLogin(goToSignIn) }, [goToSignIn])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!email || !password || (!isLogin && !name))
      return setMsg({ text: 'Please fill in all fields.', type: 'error' })
    if (!isLogin && password.length < 8)
      return setMsg({ text: 'Password must be at least 8 characters.', type: 'error' })
    setLoading(true)
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const body = isLogin ? { email, password } : { name, email, password }
      const data = await api(endpoint, 'POST', body)
      onAuth(data.data.token)
    } catch (err) {
      setMsg({ text: err.message || 'An unknown error occurred', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h1>{isLogin ? 'Welcome back' : 'Create account'}</h1>
      <p className="subtitle">
        {isLogin
          ? 'Sign in to verify your phone number.'
          : 'Sign up to start verifying your phone number securely.'}
      </p>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label>Full name</label>
            <input type="text" placeholder="Ada Lovelace" autoComplete="name"
                   value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label>Email address</label>
          <input type="email" placeholder="ada@example.com" autoComplete="email"
                 value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Min. 8 characters" autoComplete="current-password"
                 value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        <button type="submit" className={`btn-primary${loading ? ' loading' : ''}`} disabled={loading}>
          {isLogin ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <div className="toggle-link">
        <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
        <a onClick={() => setIsLogin(!isLogin)}> {isLogin ? 'Sign up' : 'Sign in'}</a>
      </div>
    </div>
  )
}
