import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { useLocation } from "wouter";

interface SubscriptionStatus {
  status: string;
  currentPeriodEnd?: number;
  nextBillingDate?: string;
}

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: subscriptionStatus, refetch: refetchSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription-status"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-portal-session");
      return res.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error) => {
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
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    },
  });

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

  const handleSubscribeClick = () => {
    setLocation("/subscribe");
  };

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  const isSubscriptionActive = subscriptionStatus?.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
            Welcome back, {user.firstName || user.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your subscription and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Status Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Subscription Status</CardTitle>
                  <Badge 
                    variant={isSubscriptionActive ? "default" : "secondary"}
                    data-testid={`badge-subscription-${isSubscriptionActive ? 'active' : 'inactive'}`}
                  >
                    <i className={`fas ${isSubscriptionActive ? 'fa-check-circle' : 'fa-times-circle'} mr-1`}></i>
                    {isSubscriptionActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!isSubscriptionActive ? (
                  <div className="text-center py-8">
                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-credit-card text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-subscription">
                      No Active Subscription
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Subscribe to our premium service for just $1/month
                    </p>
                    <Button 
                      onClick={handleSubscribeClick}
                      className="bg-brand-600 hover:bg-brand-700"
                      data-testid="button-subscribe-now"
                    >
                      <i className="fas fa-star mr-2"></i>
                      Subscribe Now
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900" data-testid="text-plan-name">
                          Premium Plan
                        </p>
                        <p className="text-sm text-gray-600" data-testid="text-plan-price">
                          $1.00 / month
                        </p>
                      </div>
                      {subscriptionStatus?.nextBillingDate && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Next billing date</p>
                          <p className="text-sm font-medium text-gray-900" data-testid="text-next-billing">
                            {subscriptionStatus.nextBillingDate}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="pt-4">
                      <Button
                        variant="ghost"
                        onClick={handleManageSubscription}
                        disabled={portalMutation.isPending}
                        className="text-brand-600 hover:text-brand-500 p-0 h-auto font-medium"
                        data-testid="button-manage-subscription"
                      >
                        <i className="fas fa-cog mr-1"></i>
                        {portalMutation.isPending ? 'Opening...' : 'Manage Subscription'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-user-email">
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member since</p>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-member-since">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    }) : 'Recently'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
