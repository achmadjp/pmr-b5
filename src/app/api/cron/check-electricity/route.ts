import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Vercel cron authentication
export const runtime = 'edge';
const CRON_SECRET = process.env.CRON_SECRET;

async function getElectricityStatus() {
  try {
    const response = await fetch('https://pmr-b5.vercel.app/api/electricity-status');
    if (!response.ok) {
      throw new Error('Failed to fetch electricity status');
    }
    const data = await response.json();
    return {
      isOn: data.isOn,
      lastUpdated: new Date(data.lastUpdated),
    };
  } catch (error) {
    console.error('Error getting electricity status:', error);
    return null;
  }
}

async function sendDelayWarningEmail(lastUpdatedTime: Date) {
  const timeDifferenceHours = (Date.now() - lastUpdatedTime.getTime()) / (1000 * 60 * 60);
  
  await resend.emails.send({
    from: 'PMR B5 <onboarding@resend.dev>',
    to: ['achmadjeihanpahlevi@gmail.com'],
    subject: 'PMR B5 - Electricity Status Update Delay Warning',
    html: `
      <h1>PMR B5 - Electricity Status Update Delay Warning</h1>
      <p>The electricity status hasn't been updated for ${timeDifferenceHours.toFixed(1)} hours.</p>
      <p>Last update was at: ${lastUpdatedTime.toLocaleString()}</p>
      <p>This might indicate:</p>
      <ul>
        <li>The Raspberry Pi has lost connection</li>
        <li>The monitoring service is not running</li>
        <li>There might be an issue with the sensors</li>
      </ul>
      <p>Please check the Raspberry Pi connection and the monitoring service.</p>
    `,
  });
}

export async function GET(request: Request) {
  try {
    // Verify cron job authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const status = await getElectricityStatus();
    
    if (!status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Could not fetch electricity status' 
      });
    }

    const now = new Date();
    const timeDifferenceMinutes = (now.getTime() - status.lastUpdated.getTime()) / (1000 * 60);

    // If last update is older than 10 minutes but less than 1.5 hour
    if (timeDifferenceMinutes > 10 && timeDifferenceMinutes < 90) {
      await sendDelayWarningEmail(status.lastUpdated);
        return NextResponse.json({ 
          success: true, 
          action: 'warning_email_sent',
          timeDifferenceMinutes 
        });
    }

    return NextResponse.json({ 
      success: true, 
      action: 'no_action_needed',
      timeDifferenceMinutes 
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' });
  }
} 
