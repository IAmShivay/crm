/**
 * Database Migration Script: Fix Role Indexes
 * 
 * This script fixes the Role collection indexes to allow duplicate role names
 * across different workspaces while maintaining uniqueness within each workspace.
 */

const { MongoClient } = require('mongodb');

async function fixRoleIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://root:9CJqBIBm4S7IVuPazC4wOE19ANUSSQErfi3SwxMqgf1wQ2PAfC9qjSkAMAxRHC0r@46.202.167.64:27202/?directConnection=true';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const rolesCollection = db.collection('roles');

    // Get current indexes
    const indexes = await rolesCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Check if there's a unique index on just 'name'
    const nameIndex = indexes.find(idx => 
      idx.key.name === 1 && 
      Object.keys(idx.key).length === 1 && 
      idx.unique === true
    );

    if (nameIndex) {
      console.log('Found problematic unique index on name field:', nameIndex.name);
      
      // Drop the problematic index
      await rolesCollection.dropIndex(nameIndex.name);
      console.log('Dropped unique index on name field');
    } else {
      console.log('No problematic unique index on name field found');
    }

    // Check if compound index exists
    const compoundIndex = indexes.find(idx => 
      idx.key.workspaceId === 1 && 
      idx.key.name === 1 && 
      idx.unique === true
    );

    if (!compoundIndex) {
      console.log('Creating compound unique index on workspaceId + name');
      await rolesCollection.createIndex(
        { workspaceId: 1, name: 1 }, 
        { unique: true, name: 'workspaceId_1_name_1_unique' }
      );
      console.log('Created compound unique index');
    } else {
      console.log('Compound unique index already exists');
    }

    // Verify final indexes
    const finalIndexes = await rolesCollection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => ({ 
      name: idx.name, 
      key: idx.key, 
      unique: idx.unique 
    })));

    console.log('Role indexes fixed successfully!');

  } catch (error) {
    console.error('Error fixing role indexes:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  fixRoleIndexes()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixRoleIndexes };
