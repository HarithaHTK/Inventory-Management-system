#!/usr/bin/env node

/**
 * Email Reporting System Test Script
 * 
 * This script helps you test your email reporting setup by:
 * 1. Checking environment variables
 * 2. Testing Redis connection
 * 3. Creating a test merchant
 * 4. Sending a test email
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkEnvironment() {
  log('\n📋 Checking Environment Configuration...', 'blue');
  
  const required = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'REDIS_HOST'];
  const missing = [];
  
  required.forEach(key => {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
      log(`  ❌ ${key} is not set`, 'red');
    } else {
      const display = key === 'SENDGRID_API_KEY' 
        ? value.substring(0, 10) + '...' 
        : value;
      log(`  ✓ ${key}: ${display}`, 'green');
    }
  });
  
  if (missing.length > 0) {
    log('\n⚠️  Missing required environment variables!', 'yellow');
    log('Please update your .env file with the missing values.', 'yellow');
    return false;
  }
  
  return true;
}

async function login() {
  log('\n🔐 Logging in...', 'blue');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin'
    });
    
    const token = response.data.access_token;
    log('  ✓ Login successful', 'green');
    return token;
  } catch (error) {
    log('  ❌ Login failed. Make sure the backend is running.', 'red');
    console.error(error.message);
    return null;
  }
}

async function createTestMerchant(token, email) {
  log('\n👤 Creating test merchant...', 'blue');
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/merchants`,
      {
        name: 'Test Merchant',
        email: email,
        companyName: 'Test Company',
        receiveReports: true
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    log(`  ✓ Created merchant: ${response.data.name} (${response.data.email})`, 'green');
    return response.data.id;
  } catch (error) {
    if (error.response?.status === 409) {
      log('  ℹ️  Merchant with this email already exists', 'yellow');
      
      // Try to find the existing merchant
      try {
        const merchants = await axios.get(`${API_BASE_URL}/merchants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const existing = merchants.data.find(m => m.email === email);
        if (existing) {
          log(`  ✓ Using existing merchant: ${existing.id}`, 'green');
          return existing.id;
        }
      } catch (err) {
        log('  ❌ Could not find existing merchant', 'red');
        return null;
      }
    } else {
      log(`  ❌ Failed to create merchant: ${error.message}`, 'red');
      return null;
    }
  }
}

async function sendTestReport(token, merchantId) {
  log('\n📧 Sending test report...', 'blue');
  
  try {
    await axios.post(
      `${API_BASE_URL}/reports/send-to-merchant/${merchantId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    log('  ✓ Email queued successfully!', 'green');
    log('  ℹ️  Check your inbox in a few moments', 'blue');
    return true;
  } catch (error) {
    log(`  ❌ Failed to send report: ${error.message}`, 'red');
    return false;
  }
}

async function checkQueueStatus(token) {
  log('\n📊 Checking email queue status...', 'blue');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/email/queue-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const stats = response.data;
    log(`  Waiting: ${stats.waiting}`, 'blue');
    log(`  Active: ${stats.active}`, 'blue');
    log(`  Completed: ${stats.completed}`, 'green');
    log(`  Failed: ${stats.failed}`, stats.failed > 0 ? 'red' : 'blue');
  } catch (error) {
    log(`  ❌ Could not fetch queue stats`, 'red');
  }
}

async function main() {
  log('='.repeat(60), 'blue');
  log('  Email Reporting System - Test Script', 'blue');
  log('='.repeat(60), 'blue');
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    process.exit(1);
  }
  
  // Login
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  // Get test email
  const email = await question('\nEnter your test email address: ');
  if (!email || !email.includes('@')) {
    log('Invalid email address', 'red');
    process.exit(1);
  }
  
  // Create merchant
  const merchantId = await createTestMerchant(token, email);
  if (!merchantId) {
    process.exit(1);
  }
  
  // Send test email
  const proceed = await question('\nSend test email now? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    const sent = await sendTestReport(token, merchantId);
    
    if (sent) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await checkQueueStatus(token);
      
      log('\n✨ Test completed successfully!', 'green');
      log('Check your email inbox for the inventory report.', 'green');
    }
  } else {
    log('\nTest cancelled', 'yellow');
  }
  
  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
