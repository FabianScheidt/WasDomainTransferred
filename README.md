# Was Some Domain Transferred?

That's a question that I'm asking way to often and for some reason it takes ages for my colleague to do it. So I decided to build a quick website to remind him.

## How does it work?

This is a simple Node.js script that is indended to be used with AWS Lambda and AWS API Gateway. It queries the WHOIS API from whoisxmlapi.com and checks the organization against a know value. Depending on the check result, the page shows a different message.

## Where can I see it action?

It is available at [https://wurde-hotsprings.io-schon-umgezogen.wtf](https://wurde-hotsprings.io-schon-umgezogen.wtf).