// MSAL configuration
const msalConfig = {
    auth: {
        clientId: "7cf7cc59-4d88-4f3b-9905-f4a5f4afc5ed", // From your Azure registration
        authority: "https://login.microsoftonline.com/f343342e-0cb9-4547-b306-b732de870365",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

const loginRequest = {
    scopes: ["User.Read", "Mail.Read", "Calendars.Read"]
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

async function signIn() {
    try {
        await msalInstance.initialize();
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        console.log("Login Success:", loginResponse);
        return loginResponse.account;
    } catch (error) {
        console.error("Login Error:", error);
    }
}

async function getAccessToken() {
    const account = msalInstance.getAllAccounts()[0];
    if (!account) return null;

    const silentRequest = {
        ...loginRequest,
        account: account
    };

    try {
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        return response.accessToken;
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            const response = await msalInstance.acquireTokenPopup(silentRequest);
            return response.accessToken;
        }
        throw error;
    }
}

async function fetchEmails() {
    const token = await getAccessToken();
    if (!token) return;

    const response = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=5&$select=subject,from,receivedDateTime", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    
    return await response.json();
}
