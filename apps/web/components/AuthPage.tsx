"use client";

import { useState } from "react";
import Button from "./Button";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const [name, setName] = useState("");       // Only used in Sign Up
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleAuth = async () => {
        const endpoint = isSignin
            ? "http://localhost:3002/signin"
            : "http://localhost:3002/signup";

        const payload = isSignin
            ? { email, password }
            : { email, password, name };

        console.log(JSON.stringify(payload))
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            console.log(data); // Handle token, redirect, error message, etc.
        } catch (err) {
            console.error("Auth failed:", err);
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
            </div>
        </div>
    );
}
