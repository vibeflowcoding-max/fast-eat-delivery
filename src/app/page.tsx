export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Delivery App - Testing Root</h1>
      <p>Status: Deployment successful.</p>
      <p>If you see this, the routing is working correctly.</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/login" style={{ color: '#FF6B35', fontWeight: 'bold' }}>Ir al Login</a>
      </div>
    </div>
  );
}
