const express = require('express');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Proxy endpoint
app.post('/api/proxy', async (req, res) => {
    try {
        const { url, headers = {} } = req.body;
        
        console.log(`[${new Date().toISOString()}] Proxying: ${url}`);

        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                ...headers,
                'accept': 'application/json',
                'cache-control': 'no-cache'
            }
        };

        const proxyReq = protocol.request(options, (proxyRes) => {
            let data = '';

            proxyRes.on('data', (chunk) => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    res.json(jsonData);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    res.status(500).json({ error: 'Invalid JSON response' });
                }
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.status(500).json({ error: error.message });
        });

        proxyReq.end();

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ Server running at http://localhost:${PORT}`);
    console.log(`📂 Open http://localhost:${PORT} in your browser\n`);
});
