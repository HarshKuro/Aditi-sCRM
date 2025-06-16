#!/usr/bin/env node

const http = require('http');

const setupDatabase = async () => {
  console.log('🚀 Setting up Prospex CRM database...');
  
  try {
    // Check health first
    console.log('📡 Checking database connection...');
    const healthResponse = await fetch('http://localhost:9002/api/health');
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed');
      return;
    }

    // Seed users
    console.log('👥 Creating initial users...');
    const seedResponse = await fetch('http://localhost:9002/api/seed/users', {
      method: 'POST',
    });
    const seedData = await seedResponse.json();
    
    if (seedResponse.ok) {
      console.log('✅ Initial users created successfully');
      console.log('\n📋 Available Accounts:');
      console.log('- Admin: admin@prospex.com / admin123');
      console.log('- Manager: manager@prospex.com / manager123');
      console.log('- Employee: employee@prospex.com / emp123');
    } else {
      console.log('ℹ️ Users may already exist:', seedData.message);
    }

    console.log('\n🎉 Setup complete! You can now log in to the application.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nMake sure the development server is running:');
    console.log('npm run dev');
  }
};

setupDatabase();
