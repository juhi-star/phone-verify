export default function Steps({ step }) {
  return (
    <div className="steps">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={`step${i < step ? ' done' : i === step ? ' active' : ''}`} />
      ))}
    </div>
  )
}
