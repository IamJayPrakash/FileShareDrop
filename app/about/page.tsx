import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen px-4 py-12 sm:py-16 md:py-20 bg-background text-foreground">
      <div className="max-w-4xl mx-auto mb-12 sm:mb-16 text-center">
        <h1 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary drop-shadow-lg">
          About FileShareDrop
        </h1>
        <p className="mb-8 text-base sm:text-lg md:text-xl text-muted-foreground">
          FileShareDrop is a modern, secure, and user-friendly platform designed
          to make file sharing effortless and safe. Our mission is to empower
          users to transfer files with confidence, privacy, and speed.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-8">
          <div className="flex-1 p-6 sm:p-8 border shadow-lg bg-card rounded-xl border-border mb-6 md:mb-0">
            <h2 className="mb-4 text-xl sm:text-2xl font-bold text-primary">
              Our Mission
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              We believe in privacy-first, hassle-free file sharing. No
              sign-ups, no tracking—just fast, secure uploads and instant
              shareable links.
            </p>
          </div>
          <div className="flex-1 p-6 sm:p-8 border shadow-lg bg-card rounded-xl border-border">
            <h2 className="mb-4 text-xl sm:text-2xl font-bold text-primary">
              Why Choose Us?
            </h2>
            <ul className="space-y-2 sm:space-y-3 text-base sm:text-lg text-left list-disc list-inside text-muted-foreground">
              <li>End-to-end secure uploads</li>
              <li>Links expire after 24 hours for privacy</li>
              <li>Modern, intuitive interface</li>
              <li>No registration required</li>
              <li>Open-source & community-driven</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-20">
        <h2 className="mb-8 text-3xl font-bold text-center text-primary">
          Meet the Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          <div className="flex flex-col items-center p-6 shadow bg-card text-card-foreground rounded-xl">
            <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 text-2xl sm:text-3xl font-bold rounded-full bg-primary/10 text-primary">
              J
            </div>
            <h3 className="mb-2 text-lg sm:text-xl font-semibold">
              Jay Prakash
            </h3>
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              Founder & Lead Developer
            </p>
          </div>
          <div className="flex flex-col items-center p-6 shadow bg-card text-card-foreground rounded-xl">
            <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 text-2xl sm:text-3xl font-bold rounded-full bg-primary/10 text-primary">
              A
            </div>
            <h3 className="mb-2 text-lg sm:text-xl font-semibold">Maddy</h3>
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              UI/UX Designer
            </p>
          </div>
          <div className="flex flex-col items-center p-6 shadow bg-card text-card-foreground rounded-xl">
            <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 text-2xl sm:text-3xl font-bold rounded-full bg-primary/10 text-primary">
              S
            </div>
            <h3 className="mb-2 text-lg sm:text-xl font-semibold">
              Shubham Kumar
            </h3>
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              Security Engineer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
