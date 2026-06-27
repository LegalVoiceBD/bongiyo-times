import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // এটি আপনার হোমপেজ এবং অন্য পেজগুলোর ক্যাশ তৎক্ষণাৎ ক্লিয়ার করে দেবে
    revalidatePath('/', 'layout'); 
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
}
