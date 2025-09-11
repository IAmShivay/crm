/**
 * Database Cleanup Script: Remove Duplicate Indexes
 * 
 * This script removes duplicate and conflicting indexes from all collections
 * to eliminate Mongoose warnings and optimize database performance.
 */

const { MongoClient } = require('mongodb');

async function cleanupDuplicateIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://root:9CJqBIBm4S7IVuPazC4wOE19ANUSSQErfi3SwxMqgf1wQ2PAfC9qjSkAMAxRHC0r@46.202.167.64:27202/?directConnection=true';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    
    // Collections to clean up
    const collections = [
      'users',
      'workspaces', 
      'workspacemembers',
      'roles',
      'leads',
      'activities',
      'tags',
      'webhooks',
      'webhooklogs',
      'subscriptions',
      'leadstatuses',
      'leadnotes',
      'invitations',
      'plans'
    ];

    for (const collectionName of collections) {
      console.log(`\n=== Cleaning up ${collectionName} collection ===`);
      
      try {
        const collection = db.collection(collectionName);
        
        // Check if collection exists
        const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
        if (!collectionExists) {
          console.log(`Collection ${collectionName} does not exist, skipping...`);
          continue;
        }

        // Get current indexes
        const indexes = await collection.indexes();
        console.log(`Found ${indexes.length} indexes in ${collectionName}`);
        
        // Log current indexes
        indexes.forEach(idx => {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
        });

        // Remove problematic single-field unique indexes that conflict with compound indexes
        const problematicIndexes = [];

        // Check for workspaceId single field index when compound exists
        const workspaceIdSingle = indexes.find(idx => 
          Object.keys(idx.key).length === 1 && 
          idx.key.workspaceId === 1 && 
          idx.name !== '_id_'
        );
        
        const workspaceIdCompound = indexes.find(idx => 
          Object.keys(idx.key).length > 1 && 
          idx.key.workspaceId === 1
        );

        if (workspaceIdSingle && workspaceIdCompound) {
          problematicIndexes.push(workspaceIdSingle.name);
          console.log(`  Found duplicate workspaceId index: ${workspaceIdSingle.name}`);
        }

        // Check for name single field unique index when compound exists (for roles, tags)
        if (collectionName === 'roles' || collectionName === 'tags') {
          const nameSingle = indexes.find(idx => 
            Object.keys(idx.key).length === 1 && 
            idx.key.name === 1 && 
            idx.unique === true &&
            idx.name !== '_id_'
          );
          
          const nameCompound = indexes.find(idx => 
            Object.keys(idx.key).length > 1 && 
            idx.key.name === 1 &&
            idx.unique === true
          );

          if (nameSingle && nameCompound) {
            problematicIndexes.push(nameSingle.name);
            console.log(`  Found duplicate name index: ${nameSingle.name}`);
          }
        }

        // Remove problematic indexes
        for (const indexName of problematicIndexes) {
          try {
            await collection.dropIndex(indexName);
            console.log(`  ✅ Dropped problematic index: ${indexName}`);
          } catch (dropError) {
            console.log(`  ⚠️  Could not drop index ${indexName}:`, dropError.message);
          }
        }

        // Verify final indexes
        const finalIndexes = await collection.indexes();
        console.log(`Final indexes for ${collectionName}:`);
        finalIndexes.forEach(idx => {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
        });

      } catch (collectionError) {
        console.error(`Error processing collection ${collectionName}:`, collectionError.message);
      }
    }

    console.log('\n=== Index cleanup completed! ===');

  } catch (error) {
    console.error('Error cleaning up indexes:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the cleanup
cleanupDuplicateIndexes()
  .then(() => {
    console.log('Index cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Index cleanup failed:', error);
    process.exit(1);
  });
