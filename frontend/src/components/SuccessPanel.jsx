export default function SuccessPanel({ token, onLogout }) {
  return (
    <div className="fade-in">
      <div className="success-icon">✓</div>
      <div className="success-text">
        <h2>Phone verified!</h2>
        <p>Your number has been successfully verified. Your account is now fully set up.</p>
      </div>
      <div className="token-box">
        <div className="token-label">JWT Token (for API calls)</div>
        {token}
      </div>
      <button className="btn-ghost" style={{ marginTop: 16 }} onClick={onLogout}>Sign out</button>
    </div>
  )
}
