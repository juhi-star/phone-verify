import { useState } from 'react'
import Logo from './components/Logo'
import Steps from './components/Steps'
import AuthPanel from './components/AuthPanel'
import PhonePanel from './components/PhonePanel'
import OTPPanel from './components/OTPPanel'
import SuccessPanel from './components/SuccessPanel'

export default function App() {
  const [token, setToken] = useState(null)
  const [phone, setPhone] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)
  const [step, setStep] = useState(0)

  const handleAuth = (newToken) => { setToken(newToken); setStep(1) }
  const handlePhoneSubmitted = (p, exp) => { setPhone(p); setExpiresAt(exp); setStep(2) }
  const handleVerified = () => { setStep(3) }
  const handleLogout = () => { setToken(null); setPhone(null); setExpiresAt(null); setStep(0) }

  const panels = [
    <AuthPanel key="auth" onAuth={handleAuth} goToSignIn={false} />,
    <PhonePanel key="phone" token={token} onPhoneSubmitted={handlePhoneSubmitted} />,
    <OTPPanel key="otp" token={token} phone={phone} expiresAt={expiresAt} onVerified={handleVerified} />,
    <SuccessPanel key="success" token={token} onLogout={handleLogout} />,
  ]

  return (
    <div className="card">
      <Logo />
      <Steps step={step} />
      {panels[step]}
    </div>
  )
}
