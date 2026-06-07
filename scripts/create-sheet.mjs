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

  if (!email || !key) {
    console.error('Missing credentials');
    process.exit(1);
  }

  const jwt = new JWT({
    email,
    key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ],
  });

  console.log('Creating new spreadsheet...');
  const doc = await GoogleSpreadsheet.createNewSpreadsheetDocument(jwt, { title: 'NPNG HIIT & Morning Log' });
  
  console.log('Spreadsheet created with ID:', doc.spreadsheetId);

  console.log('Adding hiit_logs sheet...');
  await doc.addSheet({ title: 'hiit_logs', headerValues: ['Date', 'Timestamp'] });
  
  console.log('Adding morning_logs sheet...');
  await doc.addSheet({ title: 'morning_logs', headerValues: ['Date', 'SleepHours', 'Condition', 'Weight', 'BodyFat', 'Timestamp'] });

  console.log('Deleting default Sheet1...');
  const sheet1 = doc.sheetsByIndex[0];
  if (sheet1.title === 'Sheet1') {
    await sheet1.delete();
  }

  // Append to .env.local
  const envPath = path.join(__dirname, '../.env.local');
  fs.appendFileSync(envPath, `\nSPREADSHEET_ID="${doc.spreadsheetId}"\n`);
  
  console.log('Done! Spreadsheet ID appended to .env.local');
  console.log(`URL: https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}/edit`);
}

run().catch(console.error);
