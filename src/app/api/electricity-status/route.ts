import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const COLLECTION_NAME = 'electricity_status';
const DOCUMENT_ID = 'current_status';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (typeof body.status !== 'string' || !['up', 'down'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "up" or "down".' },
        { status: 400 }
      );
    }

    const data = {
      status: body.status,
      lastUpdated: new Date().toISOString(),
    };

    await adminDb
      .collection(COLLECTION_NAME)
      .doc(DOCUMENT_ID)
      .set(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const doc = await adminDb
      .collection(COLLECTION_NAME)
      .doc(DOCUMENT_ID)
      .get();
    
    if (!doc.exists) {
      const initialData = {
        status: 'unknown',
        lastUpdated: new Date().toISOString(),
      };
      
      await adminDb
        .collection(COLLECTION_NAME)
        .doc(DOCUMENT_ID)
        .set(initialData);
        
      return NextResponse.json(initialData);
    }
    
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Error reading status:', error);
    return NextResponse.json(
      { error: 'Failed to read status' },
      { status: 500 }
    );
  }
} 