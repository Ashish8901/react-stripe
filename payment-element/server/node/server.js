const express = require('express');
const app = express();
const {resolve} = require('path');
// Replace if using a different env file or config
const env = require('dotenv').config({path: './.env'});

const stripe = require('stripe')(
  'sk_test_51L52gAD1YKwrkWRKMQeEK3sCTSQoHY2OMuI1E8kCee0Kc6LkCkDUqcfnS4gzT6lRgviOQm7KtvsFAOZ5T5Qkj0wA000Ku5qCZ4'
);
app.use(express.static(__dirname + '/public'));
// app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// app.get('/', (req, res) => {
//   const path = resolve(process.env.STATIC_DIR + '/index.html');
//   res.sendFile(path);
// });

app.get('/config', (req, res) => {
  res.send({
    publishableKey:
      'pk_test_51L52gAD1YKwrkWRKHtm4UbAzX7rZS9c0OCCDsDw1q5WcdCoV9DlbL7X29xi7ondFCUmJNpqnjrc9GlNwHFFmRi6500b4tjiAyR',
  });
});

app.get('/create-payment-intent', async (req, res) => {
  // Create a PaymentIntent with the amount, currency, and a payment method type.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/payment_intents/create
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'USD',
      amount: 1000,
      payment_method_types: ['card'],
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

// // Expose a endpoint as a webhook handler for asynchronous events.
// // Configure your webhook in the stripe developer dashboard
// // https://dashboard.stripe.com/test/webhooks
// app.post('/webhook', async (req, res) => {
//   let data, eventType;

//   // Check if webhook signing is configured.
//   if (process.env.STRIPE_WEBHOOK_SECRET) {
//     // Retrieve the event by verifying the signature using the raw body and secret.
//     let event;
//     let signature = req.headers['stripe-signature'];
//     try {
//       event = stripe.webhooks.constructEvent(
//         req.rawBody,
//         signature,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.log(`⚠️  Webhook signature verification failed.`);
//       return res.sendStatus(400);
//     }
//     data = event.data;
//     eventType = event.type;
//   } else {
//     // Webhook signing is recommended, but if the secret is not configured in `config.js`,
//     // we can retrieve the event data directly from the request body.
//     data = req.body.data;
//     eventType = req.body.type;
//   }

//   if (eventType === 'payment_intent.succeeded') {
//     // Funds have been captured
//     // Fulfill any orders, e-mail receipts, etc
//     // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
//     console.log('💰 Payment captured!');
//   } else if (eventType === 'payment_intent.payment_failed') {
//     console.log('❌ Payment failed.');
//   }
//   res.sendStatus(200);
// });

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
