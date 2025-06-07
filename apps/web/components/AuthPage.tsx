"use client";

import { useState } from "react";
import Button from "./Button";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const [name, setName] = useState("");       // Only used in Sign Up
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const loginWithGoogle = () => {
        window.open("http://localhost:3002/auth/google", "_self");
    };


    const handleAuth = async () => {
        const endpoint = isSignin
            ? "http://localhost:3002/signin"
            : "http://localhost:3002/signup";

        const payload = isSignin
            ? { email, password }
            : { email, password, name };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.status === 200) {
                if (isSignin && data.token) {
                    // Direct redirect for signin
                    window.location.href = "/editor";
                } else if (!isSignin && data.userId) {
                    // For signup, automatically sign in
                    try {
                        const signinRes = await fetch("http://localhost:3002/signin", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({ email, password }),
                        });

                        const signinData = await signinRes.json();
                        if (signinRes.status === 200 && signinData.token) {
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
                    <button onClick={loginWithGoogle}>Login with Google</button>
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
