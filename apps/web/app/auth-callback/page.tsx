'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  const checkUserProjects = async (token: string) => {
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
        return data.projects && data.projects.length > 0;
      }
    } catch (error) {
      console.error('Error checking projects:', error);
    }
    return false;
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const authStatus = searchParams.get('status');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      setStatus('error');
      setTimeout(() => {
        router.push('/signin?error=auth_failed');
      }, 2000);
      return;
    }

    if (token) {
      try {
        // Store the token
        localStorage.setItem('authToken', token);
        console.log('✅ JWT token stored successfully');
        
        setStatus('success');
        
        // Check if user has projects and redirect accordingly
        setTimeout(async () => {
          if (authStatus === 'signup') {
            // For new users, always go to onboarding first
            router.push('/onboarding');
          } else {
            // For existing users, check if they have projects
            const hasProjects = await checkUserProjects(token);
            if (hasProjects) {
              router.push('/projects');
            } else {
              router.push('/editor');
            }
          }
        }, 1500);
      } catch (err) {
        console.error('Error storing token:', err);
        setStatus('error');
        setTimeout(() => {
          router.push('/signin?error=token_storage_failed');
        }, 2000);
      }
    } else {
      console.error('No token received from OAuth');
      setStatus('error');
      setTimeout(() => {
        router.push('/signin?error=no_token');
      }, 2000);
    }
  }, [searchParams, router]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Processing Authentication</h2>
          <p className="text-gray-500">Please wait while we complete your sign-in...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Successful!</h2>
          <p className="text-gray-500">Redirecting you to your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Failed</h2>
          <p className="text-gray-500">Redirecting you to sign-in page...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
