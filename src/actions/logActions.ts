"use server";

import { getSpreadsheet } from '@/lib/googleSheets';

export async function submitHiitLogAction(date: string, timestamp: string) {
  try {
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle['hiit_logs'];

    if (!sheet) {
      throw new Error('hiit_logs sheet not found');
    }

    await sheet.addRow({
      Date: date,
      Timestamp: timestamp
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in submitHiitLogAction:', error);
    throw new Error('Failed to submit HIIT log');
  }
}

export async function submitMorningLogAction(data: {
  date: string;
  sleepHours: number;
  condition: number;
  weight: number;
  bodyFat: number;
  timestamp: string;
}) {
  try {
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle['morning_logs'];

    if (!sheet) {
      throw new Error('morning_logs sheet not found');
    }

    const rows = await sheet.getRows();
    const existingRow = rows.find(row => row.get('Date') === data.date);

    if (existingRow) {
      // Update existing row
      existingRow.set('SleepHours', data.sleepHours);
      existingRow.set('Condition', data.condition);
      existingRow.set('Weight', data.weight);
      existingRow.set('BodyFat', data.bodyFat);
      existingRow.set('Timestamp', data.timestamp);
      await existingRow.save();
    } else {
      // Append new row
      await sheet.addRow({
        Date: data.date,
        SleepHours: data.sleepHours,
        Condition: data.condition,
        Weight: data.weight,
        BodyFat: data.bodyFat,
        Timestamp: data.timestamp
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in submitMorningLogAction:', error);
    throw new Error('Failed to submit morning log');
  }
}
