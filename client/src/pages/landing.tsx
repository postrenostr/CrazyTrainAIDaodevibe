import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-brand-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-crown text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to SubService
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Google account to get started
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-3 transition-colors duration-200"
              data-testid="button-google-login"
            >
              <i className="fab fa-google text-red-500 text-lg mr-3"></i>
              Continue with Google
            </Button>
            
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-brand-600 hover:text-brand-500">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-brand-600 hover:text-brand-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
