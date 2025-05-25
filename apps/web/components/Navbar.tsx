"use client";

import { useEffect, useState } from "react";
import Button from "../../../packages/ui/src/button";
import Link from "next/link";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkAuthStatus = () => {
    const cookies = document.cookie;
    const hasToken = cookies.includes("authorization");
    setIsLoggedIn(hasToken);
  };

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();

    // Listen for storage events (in case auth state changes in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:3002/signout", {
        method: "POST",
        credentials: "include",
      });
      // Force reload the page to ensure cookie is cleared
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  return (
    <header className="flex justify-between items-center p-6 border-b">
      <Link href="/">
        <h1 className="text-2xl font-bold">NotionClone</h1>
      </Link>

      {isLoggedIn ? (
        <Button variant="secondary" onClick={handleSignOut}>
          Sign Out
        </Button>
      ) : (
        <div className="space-x-4">
          <Link href="/signin">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
