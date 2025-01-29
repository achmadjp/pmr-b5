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

    console.log('Attempting to update current status...');
    try {
      // Update current status (for backward compatibility)
      await adminDb
        .collection(COLLECTION_NAME)
        .doc(DOCUMENT_ID)
        .set(data);
      console.log('Current status updated successfully');
    } catch (err) {
      console.error('Error updating current status:', err);
      throw err;
    }

    console.log('Attempting to add to history...');
    try {
      // Add to history
      const historyRef = await adminDb
        .collection(HISTORY_COLLECTION)
        .add({
          ...data,
          createdAt: timestamp,
        });
      console.log('History added successfully with ID:', historyRef.id);
    } catch (err) {
      console.error('Error adding to history:', err);
      throw err;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST handler:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
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

    console.log('GET request received:', { type, limit });

    if (type === 'current') {
      console.log('Fetching current status...');
      try {
        const doc = await adminDb
          .collection(COLLECTION_NAME)
          .doc(DOCUMENT_ID)
          .get();
        
        if (!doc.exists) {
          console.log('No current status found, creating initial status...');
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
        
        console.log('Current status found:', doc.data());
        return NextResponse.json(doc.data());
      } catch (err) {
        console.error('Error fetching current status:', err);
        throw err;
      }
    } else {
      console.log('Fetching history...');
      try {
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

        console.log(`Found ${history.length} history items`);
        return NextResponse.json({ history });
      } catch (err) {
        console.error('Error fetching history:', err);
        throw err;
      }
    }
  } catch (error) {
    console.error('Error in GET handler:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to read status' },
      { status: 500 }
    );
  }
} 