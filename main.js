const { app, shell, Menu, Tray, nativeImage } = require('electron');
const axios = require('axios').default;
const path = require('path');

const { Token } = require('./auth');


function timeUntil(eventTime) {
    const event = new Date(eventTime).getTime();
    const now = Date.now();

    const secondsUntil = Math.floor((event - now) / 1000);

    const seconds = secondsUntil % 60;
    const minutes = Math.floor(secondsUntil / 60) % 60
    const hours = Math.floor(secondsUntil / 3600)

    return formatDuration(hours, minutes, seconds);
}

function formatDuration(hours, minutes, seconds) {
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

async function getNextCalendarEvent(token) {

    const minTime = new Date();
    const maxTime = new Date();
    maxTime.setDate(minTime.getDate()+1);
    maxTime.setHours(0, 0, 0, 0);

    const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: {
            maxResults: 1,
            timeMin: minTime.toISOString(),
            timeMax: maxTime.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        }
    })

    return response.data.items[0] || null;
}


async function fetchEvent(token) {
    const accessToken = await token.getAccessToken();
    const calEvent = await getNextCalendarEvent(accessToken);
    if (!calEvent) {
        return null;
    }
    const { summary: name, start: { dateTime: time }, htmlLink: href } = calEvent;

    // Ignore in-progress events
    if (new Date(time) < new Date()) {
        return null;
    }

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

    let event = await fetchEvent(token);
    setInterval(async () => {
        event = await fetchEvent(token);
    }, 30000);

    setInterval(() => {
        if (!event) {
            tray.setTitle('');
            tray.setContextMenu(null);
            return;
        }

        const dur = timeUntil(event.time);
        tray.setTitle(dur);
        tray.setContextMenu(Menu.buildFromTemplate([
            { 
                label: event.name,
                type: 'normal',
                click: () => shell.openExternal(event.href),
            }
        ]));
    }, 1000);
    
});

app.on('window-all-closed', event => {
    event.preventDefault();
})
