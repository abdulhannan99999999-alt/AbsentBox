import { Configuration, PublicClientApplication } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "7cf7cc59-4d88-4f3b-9905-f4a5f4afc5ed",
        authority: "https://login.microsoftonline.com/f343342e-0cb9-4547-b306-b732de870365",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["User.Read", "Mail.ReadWrite", "Calendars.ReadWrite", "MailboxSettings.Read"]
};

export const msalInstance = new PublicClientApplication(msalConfig);
