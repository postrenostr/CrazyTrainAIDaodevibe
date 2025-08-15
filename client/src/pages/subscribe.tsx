import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are now subscribed!",
      });
      setLocation("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isSubmitting}
        className="w-full bg-brand-600 hover:bg-brand-700 font-semibold py-3"
        data-testid="button-subscribe"
      >
        {isSubmitting ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to initialize payment",
          variant: "destructive",
        });
        setLocation("/");
      });
  }, [isAuthenticated, authLoading, toast, setLocation]);

  const handleBackClick = () => {
    setLocation("/");
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="text-gray-600 hover:text-gray-900 p-0 h-auto"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
        </div>

        {/* Subscription Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-page-title">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Get premium access to all features
          </p>
        </div>

        {/* Pricing Plan */}
        <div className="max-w-lg mx-auto">
          <Card className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Plan Header */}
            <CardHeader className="bg-gradient-to-r from-brand-500 to-brand-600 text-center text-white p-8">
              <h3 className="text-2xl font-bold mb-2" data-testid="text-plan-title">Premium Plan</h3>
              <div className="flex items-center justify-center">
                <span className="text-5xl font-bold" data-testid="text-plan-price">$1</span>
                <span className="text-xl ml-2 opacity-75">/month</span>
              </div>
              <p className="mt-2 opacity-90">Perfect for getting started</p>
            </CardHeader>

            {/* Plan Features */}
            <CardContent className="p-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center" data-testid="feature-premium-access">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-gray-700">Access to all premium features</span>
                </li>
                <li className="flex items-center" data-testid="feature-support">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-gray-700">Priority customer support</span>
                </li>
                <li className="flex items-center" data-testid="feature-cancel">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-gray-700">Cancel anytime</span>
                </li>
                <li className="flex items-center" data-testid="feature-guarantee">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <span className="text-gray-700">14-day money-back guarantee</span>
                </li>
              </ul>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
                <i className="fas fa-lock mr-2"></i>
                <span data-testid="text-security-badge">Secured by Stripe</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
