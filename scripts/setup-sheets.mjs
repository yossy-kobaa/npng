import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!email || !key || !spreadsheetId) {
    console.error('Missing credentials or spreadsheet ID');
    process.exit(1);
  }

  const jwt = new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
  await doc.loadInfo();

  console.log('Connected to document:', doc.title);

  // Check if sheets exist, create them if not
  const hiitSheet = doc.sheetsByTitle['hiit_logs'];
  if (!hiitSheet) {
    console.log('Adding hiit_logs sheet...');
    await doc.addSheet({ title: 'hiit_logs', headerValues: ['Date', 'Timestamp'] });
  } else {
    console.log('hiit_logs sheet already exists.');
  }

  const morningSheet = doc.sheetsByTitle['morning_logs'];
  if (!morningSheet) {
    console.log('Adding morning_logs sheet...');
    await doc.addSheet({ title: 'morning_logs', headerValues: ['Date', 'SleepHours', 'Condition', 'Weight', 'BodyFat', 'Timestamp'] });
  } else {
    console.log('morning_logs sheet already exists.');
  }

  console.log('Setup complete!');
}

run().catch(console.error);
