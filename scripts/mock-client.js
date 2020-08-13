const Octokit = require('@octokit/rest')
const octokit = new Octokit()
const { oauthLoginUrl } = require("@octokit/oauth-login-url");
const axios = require('axios');


const {
    url
} = oauthLoginUrl({
    clientId: 'aae68b2693471600a1b4',
    redirectUri: 'https://example.com',
    login: 'd3fkon',
    scopes: ['repo', 'admin:org'],
    state: 'user-fucking-id',
    log: {
        warn(message) {
            myLogger.log(message, { level: 'warn' })
        }
    }
})


console.log("URL >>> " + url.toString())
