const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Initialize Stripe with Secret Key
// Use environment variable for security
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

exports.createStripeSession = functions.https.onCall(async (data, context) => {
  // data: { jobId, price, successUrl, cancelUrl, customerEmail, customerName }
  
  const { jobId, price, successUrl, cancelUrl, customerEmail, customerName } = data;

  if (!jobId || !price) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with jobId and price.');
  }

  try {
      // Create a Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Trip Transfer #${jobId}`,
                description: `Transfer Service`,
              },
              unit_amount: Math.round(price * 100), // cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: {
            jobId: jobId
        }
      });

      return { sessionId: session.id };
  } catch (error) {
      console.error("Stripe Error:", error);
      throw new functions.https.HttpsError('internal', error.message);
  }
});
