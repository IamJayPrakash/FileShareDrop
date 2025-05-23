import Link from 'next/link';
import React from 'react';

const Footer = () => {
  return (
    <footer className="py-8 border-t bg-muted border-border">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-semibold">FileShareDrop</h3>
            <p className="text-sm text-muted-foreground">
              Securely share files up to 50MB with expiring links.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-primary"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-primary"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/IamJayPrakash/FileShareDrop/issues/new"
                  className="transition-colors hover:text-primary"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/IamJayPrakash/FileShareDrop"
                  className="transition-colors hover:text-primary"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-sm text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} FileShareDrop. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
