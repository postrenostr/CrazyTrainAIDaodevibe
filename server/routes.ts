import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Use a stable, officially supported API version
  // @ts-ignore Stripe's type declarations only include the very latest version
  apiVersion: "2024-04-10",
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('📝 Registering routes...');
  
  // Auth middleware
  await setupAuth(app);
  
  console.log('✅ Auth setup complete, registering API routes...');
  
  // Add a simple health check endpoint that should work
  app.get('/api/health', (req, res) => {
    console.log('✅ Health check endpoint hit');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });


  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: null, // Already has active subscription
          });
        }
      }

      if (!user.email) {
        return res.status(400).json({ message: 'User email is required' });
      }

      let customerId = user.stripeCustomerId;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        });
        customerId = customer.id;
      }

      // Create product first
      const product = await stripe.products.create({
        name: 'Premium Plan',
      });

      // Create price for the product
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: 100, // $1.00 in cents
        recurring: {
          interval: 'month',
        },
        product: product.id,
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get subscription status
  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ status: 'inactive' });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Update local status if needed
      if (subscription.status !== user.subscriptionStatus) {
        await storage.updateSubscriptionStatus(
          userId, 
          subscription.status,
          (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined
        );
      }

      res.json({
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        nextBillingDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : null
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // Create customer portal session for subscription management
  app.post('/api/create-portal-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Portal session error:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  console.log('✅ All routes registered successfully');
  console.log('📝 Available routes:');
  console.log('  - GET /api/health');
  console.log('  - GET /api/auth/user');
  console.log('  - POST /api/create-subscription');
  console.log('  - GET /api/subscription-status');
  console.log('  - POST /api/create-portal-session');
  
  const httpServer = createServer(app);
  return httpServer;
}
