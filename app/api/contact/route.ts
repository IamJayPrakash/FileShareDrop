import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Contact from '@/lib/contact.model';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { ContactEmail as ContactEmailTemplate } from '@/lib/contact-email-template';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM;
const mailTo = process.env.MAIL_TO;

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    await dbConnect();
    await Contact.create({ name, email, message });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const html = render(ContactEmailTemplate({ name, email, message }));

    // Send to admin
    await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      subject: `New Contact Message from ${name}`,
      html: await html,
    });
    // Send confirmation to user
    await transporter.sendMail({
      from: mailFrom,
      to: email,
      subject: 'Thank you for contacting FileShareDrop',
      html: await render(
        ContactEmailTemplate({
          name: 'FileShareDrop Team',
          email: mailFrom || '',
          message: `Hi ${name},\n\nThank you for reaching out! We have received your message and will get back to you soon.\n\nYour message: ${message}`,
        })
      ),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us!',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to submit contact form.' },
      { status: 500 }
    );
  }
}
