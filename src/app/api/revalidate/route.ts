import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  if (slug) {
    revalidatePath(`/d/${slug}`);
  }

  return NextResponse.json({ revalidated: true });
}
