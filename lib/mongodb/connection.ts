import mongoose from 'mongoose';

interface MongoConnection {
  isConnected?: number;
}

const connection: MongoConnection = {};

async function connectToMongoDB(): Promise<void> {
  if (connection.isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const db = await mongoose.connect(mongoUri, {
      bufferCommands: false,
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function disconnectFromMongoDB(): Promise<void> {
  if (connection.isConnected) {
    await mongoose.disconnect();
    connection.isConnected = 0;
    console.log('Disconnected from MongoDB');
  }
}

// Handle connection events only in Node.js environment
if (typeof window === 'undefined') {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await disconnectFromMongoDB();
    process.exit(0);
  });
}

export { connectToMongoDB, disconnectFromMongoDB };
export default connectToMongoDB;
