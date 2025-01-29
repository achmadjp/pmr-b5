import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: 'PMR B5 <onboarding@resend.dev>',
      to: ['achmadjeihan@gmail.com'], // Using your email based on your workspace path
      subject: 'Test Email from PMR B5 Local Development',
      html: `
        <h1>Test Email from PMR B5</h1>
        <p>Hello! This is a test email sent from your local development environment.</p>
        <p>If you're receiving this email, it means:</p>
        <ul>
          <li>Your Resend API key is working correctly</li>
          <li>The email sending functionality is properly configured</li>
          <li>Your Next.js API route is functioning as expected</li>
        </ul>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
} 