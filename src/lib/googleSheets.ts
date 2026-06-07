import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getSpreadsheet() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  // Handle private key formatting issues, especially when loaded from env vars
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!email || !key || !spreadsheetId) {
    throw new Error('Google Sheets API credentials are not set in environment variables.');
  }

  // Initialize auth
  const jwt = new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // Initialize the sheet
  const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
  
  // Load document properties and worksheets
  await doc.loadInfo(); 

  return doc;
}
