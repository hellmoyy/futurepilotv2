import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

// DELETE /api/notifications/delete-all - Delete all notifications for current user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Delete all notifications for this user
    const result = await Notification.deleteMany({ 
      userEmail: session.user.email 
    });

    return NextResponse.json({
      success: true,
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
