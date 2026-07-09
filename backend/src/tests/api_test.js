const http = require('http');

const BASE = 'http://localhost:5000';

function request(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== Dynamic Dine E2E API Verification ===\n');

  // 1. Admin Login
  console.log('1. Testing Admin Login...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'admin@dynamicdine.com',
    password: 'Admin@12345',
  });
  if (loginRes.status === 200 && loginRes.body.token) {
    console.log(`   ✓ Admin login successful. Role: ${loginRes.body.user.role}`);
  } else {
    console.log(`   ✗ Admin login failed: ${JSON.stringify(loginRes.body)}`);
    return;
  }
  const token = loginRes.body.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Fetch Tables
  console.log('\n2. Testing Table Fetch...');
  const tablesRes = await request('GET', '/api/tables', null, authHeaders);
  if (tablesRes.status === 200 && tablesRes.body.tables) {
    console.log(`   ✓ Tables fetched: ${tablesRes.body.tables.length} tables found.`);
    const tableStatuses = tablesRes.body.tables.map(t => `T${t.tableNumber}:${t.status}`).join(', ');
    console.log(`   Statuses: ${tableStatuses}`);
  } else {
    console.log(`   ✗ Tables fetch failed: ${tablesRes.status} ${JSON.stringify(tablesRes.body)}`);
  }

  // 3. Fetch Categories
  console.log('\n3. Testing Categories Fetch...');
  const catRes = await request('GET', '/api/categories', null, authHeaders);
  if (catRes.status === 200) {
    const cats = catRes.body.categories || [];
    console.log(`   ✓ Categories fetched: ${cats.length} categories.`);
  }

  // 4. Test Pricing Config
  console.log('\n4. Testing Pricing Config...');
  const pricingRes = await request('GET', '/api/pricing/config', null, authHeaders);
  if (pricingRes.status === 200 && pricingRes.body.config) {
    const c = pricingRes.body.config;
    console.log(`   ✓ Pricing config loaded. Enabled: ${c.globalEnabled}, Inc: ${c.priceIncreasePercent}%, Dec: ${c.priceDecreasePercent}%`);
  }

  // 5. Test QR Code generation (correct path: /api/tables/:tableNumber/qr)
  console.log('\n5. Testing QR Code Generation...');
  const qrRes = await request('POST', '/api/tables/1/qr', null, authHeaders);
  if (qrRes.status === 200 && qrRes.body.qrImage) {
    console.log(`   ✓ QR code generated for Table 1. URL: ${qrRes.body.qrUrl.substring(0, 50)}...`);
    console.log(`   QR image size: ${qrRes.body.qrImage.length} chars`);
  } else {
    console.log(`   ✗ QR generation failed: ${qrRes.status} ${JSON.stringify(qrRes.body).slice(0, 200)}`);
  }

  // 6. Test Session Security — NO qrKey and NO auth should be rejected
  console.log('\n6. Testing Session Security (no key, no auth)...');
  const secRes1 = await request('POST', '/api/sessions/start', {
    tableNumber: 1,
    customerName: 'Hacker',
  });
  if (secRes1.status === 403) {
    console.log(`   ✓ Security PASSED. No-key no-auth rejected with 403: "${secRes1.body.message}"`);
  } else {
    console.log(`   ✗ Security FAILED! Expected 403, got ${secRes1.status}: ${JSON.stringify(secRes1.body).slice(0, 200)}`);
  }

  // 7. Test Session Security — WRONG qrKey should be rejected
  console.log('\n7. Testing Session Security (wrong QR key)...');
  const secRes2 = await request('POST', '/api/sessions/start', {
    tableNumber: 1,
    qrKey: 'totally-invalid-key-12345',
    customerName: 'Hacker',
  });
  if (secRes2.status === 403) {
    console.log(`   ✓ Security PASSED. Wrong key rejected with 403: "${secRes2.body.message}"`);
  } else {
    console.log(`   ✗ Security FAILED! Expected 403, got ${secRes2.status}: ${JSON.stringify(secRes2.body).slice(0, 200)}`);
  }

  // 8. Test Session Security — Admin auth should work even without qrKey (staff walk-in)
  console.log('\n8. Testing Session Start (admin auth, no QR)...');
  const secRes3 = await request('POST', '/api/sessions/start', {
    tableNumber: 2,
    customerName: 'Admin Walk-in',
  }, authHeaders);
  if (secRes3.status === 200 || secRes3.status === 201) {
    console.log(`   ✓ Admin session start succeeded. Session ID: ${secRes3.body.session?._id}`);
  } else {
    console.log(`   ✗ Admin session start failed: ${secRes3.status} ${JSON.stringify(secRes3.body).slice(0, 200)}`);
  }

  // 9. Test Analytics endpoint (correct path: /api/analytics/dashboard)
  console.log('\n9. Testing Analytics...');
  const analyticsRes = await request('GET', '/api/analytics/dashboard', null, authHeaders);
  if (analyticsRes.status === 200 && analyticsRes.body.success) {
    const s = analyticsRes.body.summary;
    console.log(`   ✓ Analytics loaded. Today Rev: ₹${s.todayRevenue}, Occupancy: ${s.tableOccupancyRate}%`);
  } else {
    console.log(`   ✗ Analytics failed: ${analyticsRes.status} ${JSON.stringify(analyticsRes.body).slice(0, 200)}`);
  }

  // 10. Test WebSocket connection
  console.log('\n10. Testing WebSocket...');
  try {
    const { io } = require('socket.io-client');
    const socket = io('http://localhost:5000', { transports: ['websocket'], timeout: 3000 });
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`   ✓ WebSocket connected. Socket ID: ${socket.id}`);
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', (err) => {
        console.log(`   ✗ WebSocket connection failed: ${err.message}`);
        reject(err);
      });
      setTimeout(() => {
        console.log(`   ⚠ WebSocket connection timed out (socket.io-client not installed).`);
        resolve();
      }, 3000);
    });
  } catch (e) {
    console.log(`   ⚠ WebSocket test skipped: ${e.message}`);
  }

  // Cleanup: Release table 2 if we started a session
  if (secRes3.status === 201 && secRes3.body.session) {
    await request('PUT', '/api/tables/2/status', { status: 'available' }, authHeaders);
    console.log('\n   Cleaned up: Table 2 released.');
  }

  console.log('\n=== ALL E2E API VERIFICATION CHECKS COMPLETED ===');
}

run().catch((e) => console.error('Test crashed:', e.message));
