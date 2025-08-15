"use client";

import { useState } from "react";
import Button from "./Button";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const [name, setName] = useState("");       // Only used in Sign Up
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const loginWithGoogle = () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
        console.log('Backend URL:', backendUrl); // Debug log
        window.open(`${backendUrl}/api/auth/google`, "_self");
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
                    // Direct redirect for signin
                    window.location.href = "/editor";
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
                            window.location.href = "/editor";
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


    return (
        <div className="m-28 flex justify-center items-center text-white">
            <div className="p-6 m-2 border-2 rounded-lg">
                {!isSignin && (
                    <div className="p-2">
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-black px-2"
                        />
                    </div>
                )}
                <div className="p-2">
                    <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="text-black px-2"
                    />
                </div>
                <div className="p-2">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="text-black px-2"
                    />
                </div>
                <div className="p-2">
                    <Button type="button" onClick={() => {
                        // No event param — so this works
                        handleAuth();
                    }}>
                        {isSignin ? "Sign in" : "Sign Up"}
                    </Button>



                </div>
                <div>
                    <button 
                        onClick={loginWithGoogle}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                        Sign in with Google
                    </button>
                </div>
                {message && (
                    <div className="p-2 text-center text-sm font-bold text-gray-600">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
