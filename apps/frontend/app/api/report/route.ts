import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the report.json file relative to the project root
    const reportPath = path.join(process.cwd(), '../../evaluation/report/report.json');
    
    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      return NextResponse.json(
        { error: 'Report file not found' },
        { status: 404 }
      );
    }

    // Read and parse the report file
    const reportData = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(reportData);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error reading report:', error);
    return NextResponse.json(
      { error: 'Failed to read report file' },
      { status: 500 }
    );
  }
}

