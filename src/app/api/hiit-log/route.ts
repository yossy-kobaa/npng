import { NextResponse } from 'next/server';
import { getSpreadsheet } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    // 1. Verify Authorization Header
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.API_SECRET_KEY}`;
    
    if (!process.env.API_SECRET_KEY || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { date, timestamp } = body;

    if (!date || !timestamp) {
      return NextResponse.json({ error: 'Missing date or timestamp' }, { status: 400 });
    }

    // 3. Connect to Google Sheets
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle['hiit_logs'];

    if (!sheet) {
      return NextResponse.json({ error: 'hiit_logs sheet not found' }, { status: 500 });
    }

    // 4. Append row
    // Column headers are Date, Timestamp (and optionally Completed if added in spreadsheet, but we only append date and timestamp)
    await sheet.addRow({
      Date: date,
      Timestamp: timestamp
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error appending hiit_log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
