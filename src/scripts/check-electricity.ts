import { Resend } from 'resend';
import fetch from 'node-fetch';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY ?? '');

interface ElectricityStatus {
  isOn: boolean;
  lastUpdated: string;
}

async function getElectricityStatus() {
  try {
    const response = await fetch('https://pmr-b5.vercel.app/api/electricity-status');
    if (!response.ok) {
      throw new Error('Failed to fetch electricity status');
    }
    const data = await response.json() as ElectricityStatus;
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
  
  try {
    const data = await resend.emails.send({
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
    console.log('Warning email sent:', data);
  } catch (error) {
    console.error('Failed to send warning email:', error);
  }
}

async function main() {
  try {
    console.log('Checking electricity status...');
    const status = await getElectricityStatus();
    
    if (!status) {
      console.error('Could not fetch electricity status');
      process.exit(1);
    }

    const now = new Date();
    const timeDifferenceMinutes = (now.getTime() - status.lastUpdated.getTime()) / (1000 * 60);

    console.log('Time since last update:', timeDifferenceMinutes.toFixed(2), 'minutes');

    // If last update is older than 10 minutes but less than 1.5 hour
    if (timeDifferenceMinutes > 10 && timeDifferenceMinutes < 90) {
      console.log('Sending warning email...');
      await sendDelayWarningEmail(status.lastUpdated);
      console.log('Warning email sent successfully');
    } else {
      console.log('No action needed');
    }

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 