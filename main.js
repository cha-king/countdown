const { app, shell, Menu, Tray, nativeImage } = require('electron');
const axios = require('axios').default;
const path = require('path');

const { Token } = require('./auth');


const CLIENT_ID = '339864928771-mtbpret2idljjjlsvto3h4uoglbfi0u9.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://127.0.0.1'
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events.readonly',
];
const CALENDAR_ID = 'charlie.king4967@gmail.com'


function timeUntil(eventTime) {
    const event = new Date(eventTime).getTime();
    const now = Date.now();

    const secondsUntil = Math.floor((event - now) / 1000);
    
    const seconds = secondsUntil % 60;
    const minutes = Math.floor(secondsUntil / 60) % 60
    const hours = Math.floor(secondsUntil / 3600) % 60

    return formatDuration(hours, minutes, seconds);
}

function formatDuration(hours, minutes, seconds) {
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

async function getNextCalendarEvent(token) {
    const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: {
            maxResults: 1,
            timeMin: new Date().toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        }
    })

    return response.data.items[0];
}


async function fetchEvent(token) {
    const accessToken = await token.getAccessToken();
    const calEvent = await getNextCalendarEvent(accessToken);
    const { summary: name, start: { dateTime: time }, htmlLink: href } = calEvent;
    return {name, time, href};
}

let tray;

app.whenReady().then(async () => {
    tray = new Tray(nativeImage.createEmpty());

    const tokenPath = path.join(app.getPath('userData'), 'token.json');
    let token = Token.load(tokenPath);
    if (!token) {
        token = await Token.fetch();
        token.save(tokenPath);
    }

    const {name, time, href} = await fetchEvent(token);
    setInterval(() => {
        const dur = timeUntil(time);
        tray.setTitle(dur);
        tray.setContextMenu(Menu.buildFromTemplate([
            { 
                label: name,
                type: 'normal',
                click: () => shell.openExternal(href),
            }
        ]));
    }, 1000);
    
});

app.on('window-all-closed', event => {
    event.preventDefault();
})
