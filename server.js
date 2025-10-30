const express = require('express');
const path = require('path');

const app = express();
const PORT = 3388;

// --- In-memory Data Stores ---

// 1. Pending purchases store
const pendingPurchases = {};

// 2. Mailbox store (replaces console logging)
const mailboxes = {
    'victim@example.com': [],
    'attacker@example.com': []
};

app.use(express.json());
app.use(express.static('public'));

// --- API Endpoints ---

app.post('/api/purchase', (req, res) => {
    const requestID = String(Date.now());
    pendingPurchases[requestID] = { redeemed: false };
    console.log(`[+] Purchase initiated. Request ID: ${requestID} is now valid.`);
    res.json({ requestID });
});

app.post('/api/redeem', (req, res) => {
    const { requestID, email } = req.body;
    if (!requestID || !email) {
        return res.status(400).json({ success: false, message: 'requestID and email are required.' });
    }

    console.log(`[*] Redemption attempt received for ID: ${requestID} with email: ${email}`);

    if (pendingPurchases[requestID] && !pendingPurchases[requestID].redeemed) {
        pendingPurchases[requestID].redeemed = true;

        const voucher = `VOUCHER-CODE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const message = `Success! Your gift card voucher is: ${voucher}. (Request ID: ${requestID})`;

        // "Send email" by putting the message in the correct mailbox
        if (mailboxes[email] !== undefined) {
            mailboxes[email].push({ time: new Date().toISOString(), message });
            console.log(`  >> Voucher for Request ID ${requestID} has been sent to mailbox: ${email}`);
        } else {
            console.log(`  >> Unknown email address: ${email}`);
        }
        
        setTimeout(() => delete pendingPurchases[requestID], 100);
        return res.json({ success: true, message: `Voucher sent to ${email}` });

    } else {
        return res.status(400).json({ success: false, message: 'Invalid or already redeemed Request ID.' });
    }
});

// New endpoint to get mailbox content
app.get('/api/mailbox/:email', (req, res) => {
    const email = req.params.email;
    if (mailboxes[email]) {
        res.json(mailboxes[email]);
    } else {
        res.status(404).json({ error: 'Mailbox not found' });
    }
});

// --- Server Start ---

app.listen(PORT, () => {
    console.log(`Demonstration server running on http://localhost:${PORT}`);
    console.log('\n--- Pages ---');
    console.log('Shop: http://localhost:3388');
    console.log('Victim Mailbox: http://localhost:3388/victim_inbox.html');
    console.log('Attacker Mailbox: http://localhost:3388/attacker_inbox.html');
});