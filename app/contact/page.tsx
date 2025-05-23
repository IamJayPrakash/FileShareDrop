'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Message sent successfully!');
        setForm({ name: '', email: '', message: '' });
        toast.success(data.message || 'Message sent successfully!');
      } else {
        setError(data.error || 'Something went wrong.');
        toast.error(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Failed to send message.');
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-20 bg-background text-foreground">
      <div className="max-w-2xl mx-auto mb-16 text-center">
        <h1 className="mb-6 text-5xl font-extrabold text-primary drop-shadow-lg">
          Contact Us
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Have questions, feedback, or need support? Reach out to the
          FileShareDrop team and we’ll get back to you as soon as possible.
        </p>
      </div>
      <div className="max-w-2xl p-10 mx-auto border shadow-lg bg-card text-card-foreground rounded-xl border-border">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="block mb-2 text-lg font-medium text-primary"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full px-4 py-3 text-lg border rounded-lg border-border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your Beautiful Name"
              required
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-lg font-medium text-primary"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-3 text-lg border rounded-lg border-border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your Cool Email ID"
              required
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block mb-2 text-lg font-medium text-primary"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              className="w-full px-4 py-3 text-lg border rounded-lg border-border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="How can we help you?"
              required
              value={form.message}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 text-lg font-semibold text-primary-foreground transition rounded-lg shadow bg-primary hover:bg-primary/90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        <div className="mt-12 text-center text-muted-foreground">
          <p className="mb-2">
            Or email us directly at{' '}
            <a
              href="mailto:support@filesharedrop.com"
              className="underline text-primary"
            >
              support@filesharedrop.com
            </a>
          </p>
          <p>
            Follow us on{' '}
            <a
              href="https://github.com/IamJayPrakash/FileShareDrop/issues/new"
              className="underline text-primary"
            >
              Report Issue
            </a>{' '}
            &bull;{' '}
            <a
              href="https://github.com/IamJayPrakash/FileShareDrop"
              className="underline text-primary"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
