'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container flex flex-wrap items-center justify-between px-4 py-4 mx-auto gap-2">
        <Link
          href="/"
          className="text-2xl font-bold text-primary dark:text-slate-900"
        >
          FileShareDrop
        </Link>
        <nav className="items-center hidden gap-6 md:flex">
          <Link
            href="/"
            className="text-sm transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-sm transition-colors hover:text-primary"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm transition-colors hover:text-primary"
          >
            Contact
          </Link>
          <Button variant="default" asChild>
            <Link href="/upload">Upload Now</Link>
          </Button>
          <ThemeToggle />
        </nav>
        <button
          className="md:hidden ml-auto"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-b md:hidden bg-background border-border w-full">
          <div className="container flex flex-col gap-4 px-4 py-4 mx-auto">
            <Link
              href="/"
              className="text-sm transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Button variant="default" asChild>
              <Link href="/upload" onClick={() => setIsMenuOpen(false)}>
                Upload Now
              </Link>
            </Button>
            <div className="flex justify-end mt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
