'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, isAuthenticated } from '../../utils/api';

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin');
      return;
    }
  }, [router]);

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      // Create a welcome project for new users
      await api.createProject({
        tittle: 'Welcome to NotE!',
        data: 'Welcome to NotE! This is your first project. Start editing to create amazing content.'
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating welcome project:', error);
      // Still redirect to dashboard even if project creation fails
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to NotE!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your account has been created successfully. You're now ready to start creating and organizing your projects.
          </p>
          
          <div className="space-y-4 text-left text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <span>Create your first project</span>
            </div>
            
            <div className="flex items-start">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <span>Start writing and editing</span>
            </div>
            
            <div className="flex items-start">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <span>Collaborate with others</span>
            </div>
          </div>
          
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Getting Started...
              </div>
            ) : (
              'Get Started'
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            You can always access your projects from the dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
