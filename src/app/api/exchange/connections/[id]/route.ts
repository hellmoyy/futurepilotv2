import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ExchangeConnection } from '@/models/ExchangeConnection';

// PATCH - Update exchange connection (toggle active, update settings)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Find connection and verify ownership
    const connection = await ExchangeConnection.findOne({
      _id: id,
      userId: user._id,
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updateData: any = {};

    if (typeof body.isActive !== 'undefined') {
      updateData.isActive = body.isActive;
    }

    if (body.nickname) {
      updateData.nickname = body.nickname;
    }

    if (body.permissions) {
      updateData.permissions = body.permissions;
    }

    const updatedConnection = await ExchangeConnection.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      connection: updatedConnection,
    });
  } catch (error: any) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove exchange connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = params;

    // Find and verify ownership before deleting
    const connection = await ExchangeConnection.findOne({
      _id: id,
      userId: user._id,
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    await ExchangeConnection.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Connection removed successfully',
    });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection', details: error.message },
      { status: 500 }
    );
  }
}
