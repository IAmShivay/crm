// MongoDB initialization script for Docker
db = db.getSiblingDB('crm_database');

// Create application user
db.createUser({
  user: 'crm_user',
  pwd: 'crm_password',
  roles: [
    {
      role: 'readWrite',
      db: 'crm_database'
    }
  ]
});

// Indexes are automatically created by Mongoose schemas
// No need to manually create indexes here

print('MongoDB initialization completed successfully!');
