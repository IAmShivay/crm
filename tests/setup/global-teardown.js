/**
 * Global Test Teardown
 * 
 * This file runs once after all tests complete and cleans up the global test environment,
 * including closing database connections and stopping test servers.
 */

const mongoose = require('mongoose');

module.exports = async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  try {
    // Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ Closed mongoose connection');
    }
    
    // Stop MongoDB Memory Server
    const mongod = global.__MONGOD__;
    if (mongod) {
      await mongod.stop();
      console.log('✅ Stopped MongoDB Memory Server');
    }
    
    console.log('✅ Global test teardown completed');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
};
