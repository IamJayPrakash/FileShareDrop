import Link from 'next/link';
import React from 'react';
import { Github, Mail, Share2 } from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="py-10 border-t bg-gradient-to-br from-blue-50/80 to-blue-100/60 dark:from-gray-900/80 dark:to-gray-800/60 border-border animate-fade-in">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start">
          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-2xl font-extrabold text-primary dark:text-primary-dark-300 tracking-tight flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="FileShareDrop Logo"
                width={30}
                height={30}
                className="rounded-full"
              />{' '}
              FileShareDrop
            </h3>
            <p className="text-base text-muted-foreground max-w-xs">
              Securely share files up to{' '}
              <span className="font-semibold text-primary">50MB</span> with
              expiring, encrypted links. No sign up, no hassle.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-semibold text-primary">Links</h3>
            <ul className="space-y-2 text-base">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-primary font-medium"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-primary font-medium"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-primary font-medium"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="transition-colors hover:text-primary font-medium"
                >
                  Help / FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-semibold text-primary">Connect</h3>
            <ul className="space-y-2 text-base">
              <li>
                <a
                  href="https://github.com/IamJayPrakash/FileShareDrop/issues/new"
                  className="flex items-center gap-2 transition-colors hover:text-primary font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="w-4 h-4" /> Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/IamJayPrakash/FileShareDrop"
                  className="flex items-center gap-2 transition-colors hover:text-primary font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-4 h-4" /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-sm text-center text-muted-foreground">
          &copy; {new Date().getFullYear()}{' '}
          <span className="font-semibold text-primary">FileShareDrop</span>. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
