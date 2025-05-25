#File Share Drop

#Share files securely with ease. Upload up to 50MB and get a shareable link that expires in 24 hours.

![Alt](https://repobeats.axiom.co/api/embed/5b06e4f9c0b8e5a7a7e065bf289b0f751835713c.svg 'Repobeats analytics image')

`env.example`

```
# MongoDB connection string
MONGODB_URI=your-mongodb-connection-string

# Google SMTP credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-app-password

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email addresses
MAIL_FROM="FileShareDrop <noreply@filesharedrop.com>"
MAIL_TO=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-app-password

# Application BE URLs
ORIGIN=https://your-app-domain.com

NEXT_PUBLIC_SIGNALING_URL=https://your-signaling-server-url.com
NEXT_PUBLIC_BASE_URL=https://your-app-domain.com

# Local development alternatives (optional)
# NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
# NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Server port for BE
PORT=3001


# client/.env here https://dashboard.metered.ca/turnserver
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
METERED_API_KEY=

```
