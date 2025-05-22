import Link from 'next/link';
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-muted py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FileShareDrop</h3>
            <p className="text-sm text-muted-foreground">
              Securely share files up to 50MB with expiring links.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://twitter.com/FileShareDrop"
                  className="hover:text-primary transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/IamJayPrakash/FileShareDrop"
                  className="hover:text-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FileShareDrop. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
