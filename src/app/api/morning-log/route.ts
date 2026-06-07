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
    const { date, sleepHours, condition, weight, bodyFat, timestamp } = body;

    if (!date || sleepHours === undefined || condition === undefined || weight === undefined || bodyFat === undefined || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Connect to Google Sheets
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle['morning_logs'];

    if (!sheet) {
      return NextResponse.json({ error: 'morning_logs sheet not found' }, { status: 500 });
    }

    // 4. Update or Append
    const rows = await sheet.getRows();
    const existingRow = rows.find(row => row.get('Date') === date);

    if (existingRow) {
      // Update existing row
      existingRow.set('SleepHours', sleepHours);
      existingRow.set('Condition', condition);
      existingRow.set('Weight', weight);
      existingRow.set('BodyFat', bodyFat);
      existingRow.set('Timestamp', timestamp);
      await existingRow.save();
    } else {
      // Append new row
      await sheet.addRow({
        Date: date,
        SleepHours: sleepHours,
        Condition: condition,
        Weight: weight,
        BodyFat: bodyFat,
        Timestamp: timestamp
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in morning_log API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
