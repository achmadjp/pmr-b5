import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const COLLECTION_NAME = 'electricity_status';
const DOCUMENT_ID = 'current_status';
const HISTORY_COLLECTION = 'electricity_status_history';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (typeof body.status !== 'string' || !['up', 'down'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "up" or "down".' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const data = {
      status: body.status,
      lastUpdated: timestamp,
    };

    // Update current status (for backward compatibility)
    await adminDb
      .collection(COLLECTION_NAME)
      .doc(DOCUMENT_ID)
      .set(data);

    // Add to history
    await adminDb
      .collection(HISTORY_COLLECTION)
      .add({
        ...data,
        createdAt: timestamp,
      });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const type = searchParams.get('type') || 'current'; // 'current' or 'history'

    if (type === 'current') {
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
    } else {
      // Get history with limit
      const historySnapshot = await adminDb
        .collection(HISTORY_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ history });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to read status' },
      { status: 500 }
    );
  }
} 