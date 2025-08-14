'use client';

import FeatureCard from "../components/FeatureCard";
import { features } from "./data/features";
import Button from "../../../packages/ui/src/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes (when user signs in/out)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab auth changes)
    window.addEventListener('authStateChanged', checkAuth);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', checkAuth);
    };
  }, []);

  const handleCreateFile = () => {
    if (isAuthenticated) {
      router.push('/projects');
    } else {
      router.push('/signin');
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
      <section className="text-center py-20 px-6">
        <h2 className="text-5xl font-extrabold leading-tight mb-6">
          Your Notes, Organized <br /> and Always with You
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          A modern workspace where you can write, plan, and collaborate. All in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="primary" size="lg" onClick={handleCreateFile}>
            Create your first File
          </Button>
          
          {isAuthenticated && (
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => router.push('/projects')}
            >
              View Projects
            </Button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-16 max-w-6xl mx-auto">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>
    </main>
  );
}
