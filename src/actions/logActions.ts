"use server";

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3001';
}

export async function submitHiitLogAction(date: string, timestamp: string) {
  const res = await fetch(`${getBaseUrl()}/api/hiit-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
    },
    body: JSON.stringify({ date, timestamp }),
  });

  if (!res.ok) {
    throw new Error('Failed to submit HIIT log');
  }

  return res.json();
}

export async function submitMorningLogAction(data: {
  date: string;
  sleepHours: number;
  condition: number;
  weight: number;
  bodyFat: number;
  timestamp: string;
}) {
  const res = await fetch(`${getBaseUrl()}/api/morning-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to submit morning log');
  }

  return res.json();
}
