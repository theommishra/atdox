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
    if (!isAuthenticated) return "Create your first File";
    if (hasProjects) return "View Your Projects";
    return "Create your first File";
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
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
      <section className="text-center py-20 px-6">
        <h2 className="text-5xl font-extrabold leading-tight mb-6">
          Your Notes, Organized <br /> and Always with You
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          A modern workspace where you can write, plan, and collaborate. All in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            {getButtonText()}
          </Button>
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
