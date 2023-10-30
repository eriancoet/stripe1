require("dotenv").config({ path: "./.env" });
const express = require("express");
const app = express();

const path = require('path');

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, 'dist')));

  // Handle SPA (for routes in Vue router history mode)
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
}

app.use(express.json({}));

const apikey = 'sk_test_51O2RTpGv92Mcajf1JmOSAlv9qmOoSKn9D9ZmkNbYvRpGsW3iWE01siy3acm70Oddl0IgXsKoS1qX69snFw7TSzIK00QlFpvxCv'
const stripe = require("stripe")(apikey, {
  apiVersion: "2020-08-27",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-samples/terminal-series/stripe-terminal-list-readers",
    version: "0.0.1",
    url: "https://github.com/stripe-samples",
  },
});

app.get("/readers", async (req, res) => { 
  try {
    const { data: readers } = await stripe.terminal.readers.list()
    res.send({ readersList: readers });
  } catch (e) {
    res.send({ error: { message: e.message } })
  }
});

app.post("/readers/process-payment", async (req, res) => {
  try {
    const { amount, readerId } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount,
      payment_method_types: ["card_present"], // Fix the property name here
      capture_method: "manual" 
    });
    const reader = await stripe.terminal.readers.processPaymentIntent(readerId,{
      payment_intent: paymentIntent.id
    });
    res.send({ reader, paymentIntent });
  } catch (e) {
    res.status(500).send({ error: { message: e.message } });
  }
});

app.post("/readers/simulate-payment", async (req, res) => {
 try {
  const { readerId } = req.body;
  const reader = 
   await stripe.testHelpers.terminal.readers.presentPaymentMethod(readerId);
   res.send({ reader });
 } catch (e){
   res.send({ error: { message: e.message } });
 }
 });

 app.post("/payments/capture", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.send({ paymentIntent });
  } catch (e) {
    res.status(500).send({ error: { message: e.message } });
  }
});

app.post("/readers/cancel-action", async (req, res) =>  {
try {
  const { readerId } = req.body;
  const reader = await stripe.terminal.readers.cancelAction(readerId);
  res.send({ reader });
  } catch (error) {
    res.send({ error: { message: e.message } });
  }
})



const PORT = process.env.PORT || 4243;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
