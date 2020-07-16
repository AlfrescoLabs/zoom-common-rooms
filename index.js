const https = require('https');

const ZOOM_SUBDOMAIN = process.env.ZOOM_SUBDOMAIN;
const MEETING_IDS_TO_LOG = (process.env.ZOOM_MEETING_IDS || '').split(',');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const EVENT_PARTICIPANT_JOINED = 'meeting.participant_joined';
const EVENT_PARTICIPANT_LEFT = 'meeting.participant_left';

const MIMETYPE_JSON = 'application/json';

function generateMessage(event, action) {
    const meetingId = event.payload.object.id;
    const meetingTopic = event.payload.object.topic;
    const participantName = event.payload.object.participant.user_name;
    const zoomHostname = (ZOOM_SUBDOMAIN || 'us02web') + '.zoom.us';
    return participantName + ' ' + action + ' <https://' + zoomHostname + '/j/' + meetingId + '|' + meetingTopic + '>';
}

function sendSlackMessage(messageText) {
    console.log('Sending message:', messageText);
    const promise = new Promise(function(resolve, reject) {
        const postData = JSON.stringify({text: messageText});
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': MIMETYPE_JSON,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(SLACK_WEBHOOK_URL, options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log('Response body', chunk);
            });
            resolve(res.statusCode);
        }).on('error', (e) => {
            console.error('Error', e);
            reject(Error(e));
        });
        req.write(postData);
        req.end();
    });
    return promise;
}

function checkAuthorization(event) {
    return event.headers['authorization'] === process.env.ZOOM_APP_SECRET;
}

exports.handler = async (event) => {
    const defaultResponse = {
        statusCode: 200,
        body: '{}',
    };
    const requestContentType = (event.headers['content-type'] || '').split(';')[0];
    if (event.body && event.body !== "" && requestContentType === MIMETYPE_JSON) {
        const body = JSON.parse(event.body);
        const eventId = body.event;
        if (!checkAuthorization(event)) {
            console.log('Authorization does not match');
            return {
                statusCode: 401,
                body: '',
            }
        }
        if (eventId === EVENT_PARTICIPANT_JOINED || eventId === EVENT_PARTICIPANT_LEFT) {
            const meetingId = body.payload.object.id;
            if (MEETING_IDS_TO_LOG.indexOf(meetingId) > -1) {
                if (eventId === EVENT_PARTICIPANT_JOINED) {
                    return sendSlackMessage(generateMessage(body, 'joined'));
                } else if (eventId === EVENT_PARTICIPANT_LEFT) {
                    return sendSlackMessage(generateMessage(body, 'left'));
                }
            }
        }
    }
    return defaultResponse;
};

