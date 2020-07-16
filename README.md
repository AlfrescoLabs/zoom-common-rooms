# Zoom Common Rooms

This project provides a JavaScript module intended to be run as an AWS Lambda fufunction via an API Gateway HTTP API, which upon receiving a webhook notification of Zoom's `meeting.participant_joined` or `meeting.participant-left` events, sends a message to Slack to announce this.

## Setup

1. Add the Lambda function in AWS with a HTTP API Gateway trigger
2. Create a custom App in Zoom, enable Event Subscriptions and add a rule for the _Meeting Participant or Host joined meeting_ and _Meeting Participant or Host left meeting_ events to send a notification to the URL of the API created in _Step 1_
3. After creating your Zoom Event Subscription you should see a _Verification Token_ now displayed. Add this to value to the Lambda as an environment variable with the key `ZOOM_APP_SECRET`, this will ensure that only Zoom can call the Lambda function
4. Create another environment variable named `ZOOM_MEETING_IDS`, containing a comma-separated list of the meeting IDs that you want notifications to be posted for.
5. If you have a paid-for Zoom account, add your Zoom subdomain in the environment variable `ZOOM_SUBDOMAIN`
6. Finally create a new app in Slack (which can be private) with an incoming webhook to post messages to the channel of your choice, take the URL of this Slack-side webhook and add it to the Lambda under the environment variable `SLACK_WEBHOOK_URL`
7. That's it! Upon participants joining or leaving the Zoom meetings that you specified, a message should be posted in the Slack channel that you chose.

