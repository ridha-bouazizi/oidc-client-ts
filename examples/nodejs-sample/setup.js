#!/usr/bin/env node

/**
 * Quick setup script for OIDC Redis Integration examples
 * This script helps users get started quickly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 OIDC Redis Integration - Quick Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envSamplePath = path.join(__dirname, '.env.sample');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    if (fs.existsSync(envSamplePath)) {
        fs.copyFileSync(envSamplePath, envPath);
        console.log('✅ Created .env file');
        console.log('⚠️  Please edit .env with your OIDC provider and Redis configuration');
    } else {
        console.log('❌ .env.sample not found');
        process.exit(1);
    }
} else {
    console.log('✅ .env file already exists');
}

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('\n📦 Installing dependencies...');
    try {
        execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        console.log('✅ Dependencies installed');
    } catch (error) {
        console.log('❌ Failed to install dependencies');
        process.exit(1);
    }
} else {
    console.log('✅ Dependencies already installed');
}

// Check if parent package is built
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
    console.log('\n🔨 Building main package...');
    try {
        execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        console.log('✅ Main package built');
    } catch (error) {
        console.log('❌ Failed to build main package');
        process.exit(1);
    }
} else {
    console.log('✅ Main package already built');
}

// Test Redis connection
console.log('\n🔍 Testing setup...');
try {
    execSync('node test-setup.cjs', { stdio: 'inherit', cwd: __dirname });
    console.log('\n🎉 Setup completed successfully!');
} catch (error) {
    console.log('\n⚠️  Setup completed but tests failed. Please check your configuration.');
}

console.log('\n📋 Next steps:');
console.log('  1. Edit .env with your OIDC provider configuration');
console.log('  2. Ensure Redis is running (docker run -d -p 6379:6379 redis:7-alpine)');
console.log('  3. Run: node demo-server.cjs');
console.log('  4. Open: http://localhost:3000');
console.log('\n🔗 For detailed instructions, see: README.md');
