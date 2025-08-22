'use client';

import FeatureCard from "../components/FeatureCard";
import { features } from "./data/features";
import Button from "../../../packages/ui/src/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndProjects = async () => {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
      
      if (token) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
          const response = await fetch(`${backendUrl}/api/allprojects`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setHasProjects(data.projects && data.projects.length > 0);
          }
        } catch (error) {
          console.error('Error checking projects:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuthAndProjects();
  }, []);

  const getButtonText = () => {
    if (isLoading) return "Loading...";
    if (!isAuthenticated) return "Get Started Free";
    if (hasProjects) return "View Your Projects";
    return "Create Your First Note";
  };

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      router.push('/signin');
    } else if (hasProjects) {
      router.push('/projects');
    } else {
      router.push('/editor');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0f172a] text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative text-center py-20 px-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
              ✨ Modern note-taking workspace
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
            Your Notes, Organized <br />
            <span className="text-blue-600 dark:text-blue-400">Always with You</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            A modern workspace where you can write, plan, and collaborate. 
            <span className="font-semibold text-gray-800 dark:text-gray-200"> All in one place.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleButtonClick}
              disabled={isLoading}
              className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {getButtonText()}
            </Button>
            
            {!isAuthenticated && (
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => router.push('/signup')}
                className="px-8 py-4 text-lg font-semibold"
              >
                Sign Up Free
              </Button>
            )}
          </div>

          {/* Test Editor Button - Only for unauthenticated users */}
          {!isAuthenticated && (
            <div className="text-center mb-8">
              <div className="inline-flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm dark:shadow-gray-900/20">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  🧪 Just want to test the editor?
                </p>
                <Button 
                  variant="secondary" 
                  size="md" 
                  onClick={() => router.push('/editor')}
                  className="px-6 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                >
                  Try Editor Now
                </Button>
              </div>
            </div>
          )}

          {/* Social proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white dark:border-gray-800"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-white dark:border-gray-800"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white dark:border-gray-800"></div>
              </div>
              <span>Join 10,000+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★★★★★</span>
              <span>4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Everything you need to <br />
            <span className="text-blue-600 dark:text-blue-400">stay organized</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to make note-taking effortless and collaboration seamless
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={feature.title} className="group h-full">
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>

        {/* Additional features preview */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium">
            <span>✨</span>
            <span>Real-time sync, offline access, powerful search, and more</span>
          </div>
        </div>
      </section>
    </main>
  );
}
