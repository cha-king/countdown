const fs = require('fs');
const { randomBytes } = require('crypto');

const axios = require('axios');
const { BrowserWindow } = require('electron');

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES } = require('./config');

const refreshUrl = 'https://oauth2.googleapis.com/token';


function Token({accessToken, refreshToken, expiresAt}) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
}

Token.prototype.getAccessToken = async function() {
     if ((Date.now() / 1000) >= this.expiresAt) {
        this.accessToken = await refreshAccessToken(this.refreshToken);
     }

     return this.accessToken;
};

Token.prototype.save = function(tokenPath) {
    fs.writeFileSync(tokenPath, JSON.stringify({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt,
    }));
};

Token.load = function(tokenPath) {
    if (!fs.existsSync(tokenPath)) {
        return null;
    }
    const tokenStr = fs.readFileSync(tokenPath);
    const token = JSON.parse(tokenStr);
    return new Token(token);
}

Token.fetch = function() {
    return new Promise((resolve) => {
        createAuthWindow(token => resolve(new Token(token)));
    });
}

async function refreshAccessToken(refreshToken) {
    const response = await axios.post(refreshUrl, new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }).toString()
    )
    return response.data.access_token;
}


function createAuthWindow(callback) {
    const win = new BrowserWindow({width: 600, height: 800});
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

            callback({accessToken, refreshToken, expiresAt});

            win.close();
        }
    });

    win.loadURL(authUrl.href);
};


module.exports = {Token};
