"use client";

import { useEffect, useState } from "react";
import Button from "../../../packages/ui/src/button";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check auth status on mount
    checkAuthStatus();

    // Listen for storage events (in case auth state changes in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuthStatus = () => {
    const cookies = document.cookie;
    const hasToken = cookies.includes("authorization");
    setIsLoggedIn(hasToken);
  };

  const handleSignOut = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
      await fetch(`${backendUrl}/api/signout`, {
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
    <header className="flex justify-between items-center p-6 border-b dark:border-gray-800">
      <Link href="/">
        <h1 className="text-2xl font-bold">Atdox</h1>
      </Link>

      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted && theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        {mounted && (isLoggedIn ? (
          <Button variant="secondary" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <>
            <Link href="/signin">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </>
        ))}
      </div>
    </header>
  );
};

export default Navbar;
