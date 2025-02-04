const express = require('express');
const path = require('path');
const stripe = require('stripe')('sk_test_xxxx'); // Replace with your Stripe Secret key
const bodyParser = require('body-parser');
const app = express();

// Middleware to parse the request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint to create a paymentIntent
app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ['card'],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).send({ error: 'Failed to create paymentIntent!' });
    }
});

// Endpoint to process refund
app.post('/refund', async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    res.send({ success: true, refund });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).send({ error: 'Refund failed' });
  }
});

// Run server on port 4242
app.listen(4242, () => console.log('Server running on port 4242'));