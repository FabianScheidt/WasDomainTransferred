const https = require('https');

// Configuration. Get some one or more api keys at https://www.whoisxmlapi.com/
const domain= 'hotsprings.io';
const currentOrganization = 'Tobias Meisen - EDV-Beratung und Dienstleistungen';
const apiKeys = ['abc'];

/**
 * Fetches WHOIS data using a randomly chosen API key
 */
function fetchWhoisData() {
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?outputFormat=JSON&apiKey=${ apiKey }&domainName=${ domain }`;
    
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => data += chunk);
            resp.on('end', () => resolve(JSON.parse(data)));
        }).on("error", (err) => reject(err));
    });
}

/**
 * Fetches the WHOIS data and caches it as long as the lambda is warm.
 * We are not expecting our lambda to be warm for more than five minutes.
 * Caching saves our maximum allowed WHOIS calls.
 */
let cachedWhoisData;
async function getWhoisData() {
    if (!cachedWhoisData) {
        console.log('Fetching WHOIS data');
        cachedWhoisData = await fetchWhoisData();
    } else {
        console.log('Using cached WHOIS data');
    }
    console.log(cachedWhoisData);
    return cachedWhoisData;
    
};

/**
 * Attempts to read the WHOIS data and returns a human readable headline and
 * text that explains the outcome. Also returns a color for the page background.
 */
async function getWasTransferred() {
    console.log('Checking if domain was transferred');
    let organization;
    try {
        const whoisData = await getWhoisData();
        organization = whoisData.WhoisRecord.registryData.registrant.organization;
    } catch (e) {
        console.error('Failed to interpret WHOIS data', e);
        return {
            headline: 'Keine Ahnung!',
            text: `Beim Laden der Daten ging anscheinend etwas schief: "${ e.message }"`,
            color: '#666666',
        }
    }

    if (organization !== currentOrganization) {
        console.log(`Organization changed to ${ organization }`);
        return {
            headline: 'Anscheinend schon!',
            text: `Die registrierte Organisation hat sich verändert und lautet nun "${ organization }"`,
            color: '#19ad6e',
        }
    }
    return {
        headline: 'Nein!',
        text: `Die registrierte Organisation ist weiterhin "${ organization }"`,
        color: '#d40115',
    }
};

/**
 * Builds a html page that prints a nice text with the result
 */
async function getHtml(result) {
    console.log('Building HTML');
    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wurde ${ domain } schon umgezogen?</title>
        <style type="text/css">
            body {
                background-color: ${ result.color };
                font-family: Arial, sans-serif;
                text-align: center;
                color: #ffffff;
                padding: 100px;
            }

            .how-does-this-work {
                margin-top: 100px;
                opacity: 0.5;
            }
            .how-does-this-work a {
                color: #ffffff;
                text-decoration: none;
            }
            .how-does-this-work a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <h1>${ result.headline }</h1>
        <p>${ result.text }</p>
        <p class="how-does-this-work">
            <a href="https://github.com/FabianScheidt/WasSomeDomainTransferred" target="_blank">Wie funktioniert das?</a>
        </p>
    </body>
    </html>`;
}

/**
 * Since we are expecting high demand for this page, we run it in AWS Lamda!
 */
exports.handler = async () => {
    const result = await getWasTransferred();
    return await getHtml(result);
};
