/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config({ path: '../.env' });

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID, // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
        authority: "https://datago.ciamlogin.com/", // Full directory URL, in the form of https://login.microsoftonline.com/<tenant>+ process.env.AZURE_TENANT_ID
        clientSecret: process.env.AZURE_CLIENT_SECRET // Client secret generated from the app registration in Azure portal
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: 3,
        }
    }
}

const REDIRECT_URI = "http://localhost:443/auth/redirect";
const POST_LOGOUT_REDIRECT_URI = "http://localhost:443";
const GRAPH_ME_ENDPOINT = "https://graph.microsoft.com/v1.0/me";

module.exports = {
    msalConfig,
    REDIRECT_URI,
    POST_LOGOUT_REDIRECT_URI,
    GRAPH_ME_ENDPOINT
};