import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid';

export async function POST(request) {
  try {
    const { videoUrl, videoUrls, redirectUrl, popunderCode, socialBarCode, monetagCode } = await request.json(); // Tambahkan monetagCode

    // Mendukung input array (bulk) maupun single string
    let urlsToProcess = [];
    if (videoUrls && Array.isArray(videoUrls)) {
      urlsToProcess = videoUrls;
    } else if (videoUrl) {
      urlsToProcess = [videoUrl];
    }

    if (urlsToProcess.length === 0) {
      return NextResponse.json({ error: 'URL video wajib diisi' }, { status: 400 });
    }

    const finalRedirect = redirectUrl && redirectUrl.trim() ? redirectUrl.trim() : '';
    const finalPopunder = popunderCode && popunderCode.trim() ? popunderCode.trim() : '';
    const finalSocialBar = socialBarCode && socialBarCode.trim() ? socialBarCode.trim() : '';
    const finalMonetag = monetagCode && monetagCode.trim() ? monetagCode.trim() : ''; // Parse Monetag
    
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const results = [];

    // Loop & Generate ID untuk setiap baris URL
    for (const url of urlsToProcess) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      const id = nanoid(6);
      const dataToStore = {
        videoUrl: trimmedUrl,
        redirectUrl: finalRedirect,
        popunderCode: finalPopunder,
        socialBarCode: finalSocialBar,
        monetagCode: finalMonetag, // Simpan ke Redis
      };

      await redis.set(id, JSON.stringify(dataToStore));

      results.push({
        id,
        originalUrl: trimmedUrl,
        generatedUrl: `${baseUrl}/${id}`,
      });
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'URL video tidak valid' }, { status: 400 });
    }

    // Mengembalikan sekumpulan hasil generate
    return NextResponse.json({ results });

  } catch (error) {
    console.error('Error Generating Link:', error);
    return NextResponse.json({ error: 'Gagal memproses link' }, { status: 500 });
  }
}