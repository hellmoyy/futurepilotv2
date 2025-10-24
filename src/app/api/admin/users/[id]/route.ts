import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

// Verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { email: string; role: string };
    
    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, membershipLevel } = body;

    // Validate input
    if (!name || !email || !membershipLevel) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and membership level are required' },
        { status: 400 }
      );
    }

    // Validate membership level
    const validLevels = ['bronze', 'silver', 'gold', 'platinum'];
    if (!validLevels.includes(membershipLevel.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Invalid membership level' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already taken by another user' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        membershipLevel: membershipLevel.toLowerCase(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        membershipLevel: updatedUser.membershipLevel,
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Connect to database
    await connectDB();

    // Delete user
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      user: {
        _id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email,
      },
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user', error: error.message },
      { status: 500 }
    );
  }
}
