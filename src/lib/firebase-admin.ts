import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Validate required environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Environment variable ${envVar} is missing`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  } else {
    console.log(`Found ${envVar}`);
    // For private key, log the first and last few characters
    if (envVar === 'FIREBASE_PRIVATE_KEY') {
      const key = process.env[envVar];
      console.log(`Private key starts with: ${key.substring(0, 30)}...`);
      console.log(`Private key ends with: ...${key.substring(key.length - 30)}`);
      console.log(`Private key length: ${key.length}`);
      console.log(`Contains BEGIN marker: ${key.includes('-----BEGIN PRIVATE KEY-----')}`);
      console.log(`Contains END marker: ${key.includes('-----END PRIVATE KEY-----')}`);
    }
  }
}

// Get the Firebase private key from the environment variable
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!privateKey) {
  console.error('FIREBASE_PRIVATE_KEY is not properly formatted');
  throw new Error('FIREBASE_PRIVATE_KEY is not properly formatted');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

console.log('Service account configuration:', {
  projectId: serviceAccount.projectId,
  clientEmail: serviceAccount.clientEmail,
  privateKeyLength: serviceAccount.privateKey.length
});

try {
  if (!getApps().length) {
    console.log('Initializing Firebase Admin...');
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
    
    // Test Firestore connection
    const db = getFirestore();
    console.log('Firestore instance created');
  } else {
    console.log('Firebase Admin already initialized');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  if (error instanceof Error) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
  }
  throw error;
}

export const adminDb = getFirestore(); 