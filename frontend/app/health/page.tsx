export const dynamic = 'force-dynamic';

type HealthResponse = {
  status: string;
  uptime: number;
  timestamp: string;
  env?: string;
  database?: {
    connected: boolean;
    type?: string;
  };
};

async function fetchHealth(): Promise<HealthResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  const res = await fetch(`${baseUrl}/health`, {
    cache: 'no-store',
  });

  console.log('Health fetch response status:', res.json);

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return res.json();
}

export default async function HealthPage() {
  try {
    const health = await fetchHealth();
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Backend Health</h1>
        <ul>
          <li><strong>Status:</strong> {health.status}</li>
          <li><strong>Uptime (s):</strong> {health.uptime.toFixed(2)}</li>
          <li><strong>Timestamp:</strong> {health.timestamp}</li>
          {health.env ? <li><strong>Env:</strong> {health.env}</li> : null}
          {health.database ? (
            <li>
              <strong>Database:</strong>{' '}
              <span style={{ color: health.database.connected ? 'green' : 'red' }}>
                {health.database.connected ? '✓ Connected' : '✗ Disconnected'}
              </span>
              {health.database.type ? ` (${health.database.type})` : ''}
            </li>
          ) : null}
        </ul>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Backend Health</h1>
        <p style={{ color: 'red' }}>Failed to reach backend.</p>
        <pre>{message}</pre>
      </main>
    );
  }
}
