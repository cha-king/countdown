const { app, BrowserWindow, Tray, nativeImage } = require('electron');
const { URL, URLSearchParams } = require('url');
const { randomBytes } = require('crypto');
const axios = require('axios').default;


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


const createWindow = () => {
    const win = new BrowserWindow({width: 600, height: 800});
    // win.loadFile('index.html');
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const authState = randomBytes(6).toString('hex');
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES.join(' '),
        state: authState
    });
    authUrl.search = params;

    win.webContents.on('will-redirect', async (event, url) => {
        const redirectUrl = new URL(url);
        if (redirectUrl.host === '127.0.0.1') {
            if (redirectUrl.searchParams.get('state') !== authState) {
                console.log("Invalid oauth state");
                return;
            }
            event.preventDefault()
            const authCode = redirectUrl.searchParams.get('code');

            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: authCode,
                grant_type: 'authorization_code',
                redirect_uri: 'http://127.0.0.1'
            });
            const requestTime = Math.floor(Date.now() / 1000);
            const res = await axios.post('https://oauth2.googleapis.com/token', params.toString())
            const accessToken = res.data.access_token;
            const refreshToken = res.data.refresh_token;
            const expiresIn = res.data.expires_in;
            const expiresAt = requestTime + expiresIn;
            const calEvent = await getNextCalendarEvent(accessToken)
            
            const { summary: name, start: { dateTime: time } } = calEvent;

            console.log(name);
            console.log(time);

            setInterval(() => {
                const dur = timeUntil(time);
                tray.setTitle(`${name} - ${dur}`);
            }, 1000);

            win.close();
        }
    });

    win.loadURL(authUrl.href);
};

let tray;

app.whenReady().then(() => {
    tray = new Tray(nativeImage.createEmpty());
    createWindow();
});

app.on('window-all-closed', event => {
    event.preventDefault();
})
