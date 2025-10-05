import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    const isConnected = mongoose.connection.readyState === 1;
    const dbName = mongoose.connection.db?.databaseName;
    const collections = await mongoose.connection.db?.listCollections().toArray();

    return NextResponse.json({
      success: true,
      status: isConnected ? 'connected' : 'disconnected',
      database: dbName,
      collections: collections?.map(c => c.name) || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database Test Error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
