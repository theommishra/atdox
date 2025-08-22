"use client";

import { useState, useEffect } from "react";
import Button from "./Button";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const [name, setName] = useState("");       // Only used in Sign Up
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    const loginWithGoogle = () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
        console.log('Backend URL:', backendUrl); // Debug log
        window.open(`${backendUrl}/api/auth/google`, "_self");
    };

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

    const redirectAfterSuccess = async (token: string) => {
        setIsRedirecting(true);
        const hasProjects = await checkUserProjects(token);
        
        // Show success popup for 2 seconds before redirecting
        setTimeout(() => {
            if (hasProjects) {
                window.location.href = "/projects";
            } else {
                window.location.href = "/editor";
            }
        }, 2000);
    };

    const handleAuth = async () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
        const endpoint = isSignin
            ? `${backendUrl}/api/signin`
            : `${backendUrl}/api/signup`;

        const payload = isSignin
            ? { email, password }
            : { email, password, name };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.status === 200) {
                if (isSignin && data.token) {
                    // Store token in localStorage
                    localStorage.setItem('authToken', data.token);
                    // Show success popup and redirect
                    setShowSuccessPopup(true);
                    redirectAfterSuccess(data.token);
                } else if (!isSignin && data.userId) {
                    // For signup, automatically sign in
                    try {
                        const signinRes = await fetch(`${backendUrl}/api/signin`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ email, password }),
                        });

                        const signinData = await signinRes.json();
                        if (signinRes.status === 200 && signinData.token) {
                            // Store token in localStorage
                            localStorage.setItem('authToken', signinData.token);
                            // Show success popup and redirect
                            setShowSuccessPopup(true);
                            redirectAfterSuccess(signinData.token);
                        } else {
                            setMessage("Account created but failed to sign in. Please try signing in manually.");
                            setPassword("");
                        }
                    } catch (signinErr) {
                        console.error("Auto signin failed:", signinErr);
                        setMessage("Account created but failed to sign in. Please try signing in manually.");
                        setPassword("");
                    }
                } else {
                    setMessage(data.message || "Invalid credentials");
                    setPassword("");
                    setName("");
                    setEmail("");
                }
            } else {
                setMessage(data.message || "Invalid credentials");
                setPassword("");
                setName("");
                setEmail("");
            }
        } catch (err) {
            console.error("Auth failed:", err);
            setMessage("Server error. Please try again.");
            setPassword("");
            setName("");
            setEmail("");
        }
    };

    // Success Popup Component
    const SuccessPopup = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome back!
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {isSignin ? "Successfully signed in!" : "Account created and signed in successfully!"}
                </p>
                
                {isRedirecting && (
                    <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        <span className="text-sm">Redirecting...</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Main content with proper spacing for navbar */}
            <div className="pt-28 min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0f172a] flex items-center justify-center p-6">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
                
                <div className="relative z-10 w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {isSignin ? "Welcome back" : "Create your account"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isSignin ? "Sign in to continue to your workspace" : "Get started with your note-taking journey"}
                        </p>
                    </div>

                    {/* Auth Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                        <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-6">
                            {!isSignin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                        required
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                    required
                                />
                            </div>

                            {/* Error Message */}
                            {message && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                        {message}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                {isSignin ? "Sign In" : "Create Account"}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        {/* Google Sign In */}
                        <button 
                            onClick={loginWithGoogle}
                            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            {isSignin ? "Sign in with Google" : "Sign up with Google"}
                        </button>

                        {/* Google Sign-In Help Message */}
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                💡 If Google Sign-In is not working, try signing in manually above
                            </p>
                        </div>

                        {/* Footer Link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isSignin ? "Don't have an account? " : "Already have an account? "}
                                <a 
                                    href={isSignin ? "/signup" : "/signin"}
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
                                >
                                    {isSignin ? "Sign up" : "Sign in"}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Success Popup */}
            {showSuccessPopup && <SuccessPopup />}
        </>
    );
}
