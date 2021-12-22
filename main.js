const { app, BrowserWindow } = require('electron');
const { URL, URLSearchParams } = require('url');
const { randomBytes } = require('crypto');
const axios = require('axios');

const CLIENT_ID = '339864928771-mtbpret2idljjjlsvto3h4uoglbfi0u9.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://127.0.0.1'



const createWindow = () => {
    const win = new BrowserWindow({width: 600, height: 800});
    // win.loadFile('index.html');
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const authState = randomBytes(6).toString('hex');
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
        state: authState
    });
    authUrl.search = params;

    win.webContents.on('will-redirect', (event, url) => {
        const redirectUrl = new URL(url);
        if (redirectUrl.host === '127.0.0.1') {
            if (redirectUrl.searchParams.get('state') !== authState) {
                console.log("Invalid oauth state");
                return;
            }
            event.preventDefault()
            const authCode = redirectUrl.searchParams.get('code');
            console.log("CODE: ", authCode)

            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: authCode,
                grant_type: 'authorization_code',
                redirect_uri: 'http://127.0.0.1'
            });
            axios.post('https://oauth2.googleapis.com/token', params.toString())
            .then(res => {
                const accessToken = res.data.access_token;
                const refreshToken = res.data.refresh_token;
                const expiresIn = res.data.expires_in;
                console.log(accessToken, refreshToken, expiresIn);
                win.close();
            });
        }
    });

    win.loadURL(authUrl.href);
};

app.whenReady().then(() => {
    createWindow();
});

