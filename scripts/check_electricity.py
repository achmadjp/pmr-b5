import os
import sys
from datetime import datetime

import pytz
import requests
from resend import Resend

# Initialize Resend with API key
api_key = os.environ.get("RESEND_API_KEY")
if not api_key:
    print("RESEND_API_KEY environment variable is not set", file=sys.stderr)
    sys.exit(1)
resend = Resend(api_key=api_key)


def get_electricity_status():
    try:
        response = requests.get("https://pmr-b5.vercel.app/api/electricity-status")
        response.raise_for_status()  # Raises an HTTPError for bad responses
        data = response.json()
        return {
            "is_on": data["status"] == "up",
            "last_updated": datetime.fromisoformat(
                data["lastUpdated"].replace("Z", "+00:00")
            ),
        }
    except Exception as e:
        print(f"Error getting electricity status: {e}", file=sys.stderr)
        return None


def send_delay_warning_email(last_updated_time):
    time_difference_hours = (datetime.now() - last_updated_time).total_seconds() / 3600

    try:
        response = resend.send_email(
            sender="PMR B5 <onboarding@resend.dev>",
            to=["achmadjeihan@gmail.com", "cahyanilaili@gmail.com"],
            subject="PMR B5 - Electricity Status Update Delay Warning",
            html=f"""
                <h1>PMR B5 - Electricity Status Update Delay Warning</h1>
                <p>The electricity status hasn't been updated for {time_difference_hours:.1f} hours.</p>
                <p>Last update was at: {last_updated_time.astimezone(pytz.timezone('Asia/Jakarta')).strftime('%Y-%m-%d %H:%M:%S %Z')}</p>
                <p>This might indicate:</p>
                <ul>
                    <li>The Raspberry Pi has lost connection</li>
                    <li>The monitoring service is not running</li>
                    <li>There might be an issue with the sensors</li>
                </ul>
                <p>Please check the Raspberry Pi connection and the monitoring service.</p>
            """,
        )
        print("Warning email sent:", response)
    except Exception as e:
        print(f"Failed to send warning email: {e}", file=sys.stderr)


def main():
    try:
        print("Checking electricity status...")
        status = get_electricity_status()

        if not status:
            print("Could not fetch electricity status", file=sys.stderr)
            sys.exit(1)

        now = datetime.now(pytz.UTC)
        time_difference_minutes = (now - status["last_updated"]).total_seconds() / 60

        print(f"Time since last update: {time_difference_minutes:.2f} minutes")

        # If last update is older than 10 minutes but less than 1.5 hour
        if 10 < time_difference_minutes < 90:
            print("Sending warning email...")
            send_delay_warning_email(status["last_updated"])
            print("Warning email sent successfully")
        else:
            print("No action needed")

    except Exception as e:
        print(f"Script error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
