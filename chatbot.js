const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const VERIFY_TOKEN = 'farago_token_0086';
const PAGE_ACCESS_TOKEN = 'EAAN2ymgwK0UBO8vW8Y6szZAGZCtpkZAmCYqeVZB8M2Q1YkXZAZC8xpbvs6pkSNEIsQDy8THSOzZCXqL0uJcxvGhEVOLtT5LbHIL37QZBMvVyWh8bSsWge2Pa3iYqOYIrUEdleSRfCmH7aqZAPGTZBUSK7A37EzD4v7BEsEpF3KxHPAhMEI925r2URgne1a0a6xWsFvAQZDZD';

let userData = {};

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      const senderPSID = webhookEvent.sender.id;

      if (webhookEvent.message) {
        handleMessage(senderPSID, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPSID, webhookEvent.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

function handleMessage(senderPSID, message) {
  // Detect Language (Optional)
  // You can use a language detection library or service to determine the user's preferred language.

  // Prompt User for Name
  if (!userData[senderPSID] || !userData[senderPSID].name) {
    const messageText = 'Hi! What is your name?';
    callSendAPI(senderPSID, { text: messageText });
    return;
  }

  // Capture User Details
  if (!userData[senderPSID].country) {
    const name = message.text;
    userData[senderPSID].name = name;

    const messageText = `Thanks, ${name}! Which country do you want to export cars to?`;
    callSendAPI(senderPSID, { text: messageText });
    return;
  }

  if (!userData[senderPSID].country) {
    const country = message.text;
    userData[senderPSID].country = country;

    // Prompt for WhatsApp Number
    const messageText = `Great! Could you please provide your WhatsApp number?`;
    callSendAPI(senderPSID, { text: messageText });
    return;
  }

  if (!userData[senderPSID].whatsappNumber) {
    const whatsappNumber = message.text;
    userData[senderPSID].whatsappNumber = whatsappNumber;

    // Prompt for Car Brand and Model (if needed)
    const messageText = `Thanks! Which car brand and model are you interested in?`;
    callSendAPI(senderPSID, { text: messageText });
    return;
  }

  // All User Details Captured, Send WhatsApp Message
  sendWhatsAppMessage(userData[senderPSID]);
}

function handlePostback(senderPSID, postback) {
  // Implement postback handling if needed
}

function sendWhatsAppMessage(userDetails) {
  const message = `Hi ${userDetails.name}! We're ready to assist you with exporting cars to ${userDetails.country}. Click [here](https://api.whatsapp.com/send?phone=${userDetails.whatsappNumber}) to start a conversation on WhatsApp.`;

  callSendAPI(userDetails.senderPSID, { text: message });
}

function callSendAPI(senderPSID, message) {
  const requestBody = {
    recipient: {
      id: senderPSID
    },
    message: message
  };

  request({
    uri: 'https://graph.facebook.com/v13.0/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: requestBody
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log('Message sent successfully');
    } else {
      console.error('Unable to send message:', error);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
