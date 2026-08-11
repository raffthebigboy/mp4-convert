import { redis } from '@/lib/redis';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `cidey - ${resolvedParams.id}`,
    description: 'Watch video on cidey',
  };
}

export default async function VideoPlayerPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let rawData = null;
  try {
    rawData = await redis.get(id);
  } catch (err) {
    console.error('Failed to fetch from Redis:', err);
  }

  if (!rawData) {
    notFound();
  }

  let videoUrl = '';
  let redirectUrl = '';
  let popunderCode = '';
  let socialBarCode = '';
  let monetagCode = ''; // Inisialisasi variabel Monetag

  if (typeof rawData === 'object' && rawData !== null) {
    videoUrl = rawData.videoUrl || '';
    if (rawData.redirectUrl) redirectUrl = rawData.redirectUrl;
    if (rawData.popunderCode) popunderCode = rawData.popunderCode;
    if (rawData.socialBarCode) socialBarCode = rawData.socialBarCode;
    if (rawData.monetagCode) monetagCode = rawData.monetagCode; // Assign Monetag
  } else if (typeof rawData === 'string') {
    if (rawData.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawData);
        videoUrl = parsed.videoUrl || '';
        if (parsed.redirectUrl) redirectUrl = parsed.redirectUrl;
        if (parsed.popunderCode) popunderCode = parsed.popunderCode;
        if (parsed.socialBarCode) socialBarCode = parsed.socialBarCode;
        if (parsed.monetagCode) monetagCode = parsed.monetagCode; // Assign Monetag
      } catch (e) {
        videoUrl = rawData;
      }
    } else {
      videoUrl = rawData;
    }
  }

  const proxyVideoUrl = `/api/proxy-video?id=${id}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-200">
      
      {/* Dynamic Ad Scripts Injection */}
      {socialBarCode && (
        <div dangerouslySetInnerHTML={{ __html: socialBarCode }} />
      )}
      {popunderCode && (
        <div dangerouslySetInnerHTML={{ __html: popunderCode }} />
      )}
      {monetagCode && (
        <div dangerouslySetInnerHTML={{ __html: monetagCode }} />
      )}

      {/* Header Bar (Videy 1:1 Style) */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-black hover:opacity-80 transition-opacity font-sans">
          cidey
        </Link>

        <a
          id="upload-btn"
          href={redirectUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 rounded-full bg-[#0d0e15] hover:bg-slate-800 text-white text-sm font-medium transition-all shadow-sm cursor-pointer"
        >
          Upload
        </a>
      </header>

      {/* Main Video Viewport (Centered) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-8 flex flex-col items-center justify-center">
        
        {/* Video Container with ID for Click Popunder Listener */}
        <div id="video-wrapper" className="relative max-w-full flex flex-col items-center justify-center cursor-pointer">
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-md flex items-center justify-center max-h-[75vh]">
            <video
              id="main-player"
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
            >
              <source src={proxyVideoUrl} type="video/mp4" />
              Browser Anda tidak mendukung pemutaran video ini.
            </video>
          </div>

          {/* Share Video Pill Button (Videy style) */}
          <div className="mt-5 flex items-center justify-center">
            <button
              id="share-btn"
              type="button"
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200/60 shadow-sm active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="share-txt">Share video</span>
            </button>
          </div>
        </div>

        {/* Developer Branding */}
        <div className="mt-12 text-center">
          <p className="text-[11px] tracking-widest font-extrabold text-slate-400 uppercase">
            2026 COPYRIGHT © CIDEY - ALL RIGHTS RESERVED
          </p>
        </div>

      </main>

      {/* Script Handler untuk Smartlink Popunder & Share Button */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var SMARTLINK_URL = ${JSON.stringify(redirectUrl)};
              var COOLDOWN_MS = 15000;
              var lastTriggered = 0;

              function triggerSmartlink() {
                if (!SMARTLINK_URL) return;
                var now = Date.now();
                if (now - lastTriggered > COOLDOWN_MS) {
                  lastTriggered = now;
                  window.open(SMARTLINK_URL, '_blank');
                }
              }

              function initEvents() {
                var uploadBtn = document.getElementById('upload-btn');
                if (uploadBtn) {
                  uploadBtn.addEventListener('click', function(e) {
                    if (!SMARTLINK_URL) {
                      e.preventDefault();
                      return;
                    }

                    // Biarkan fungsi native <a> berjalan seperti semula.
                    // Hanya lakukan paksaan JS JIKA AdBlocker benar-benar menghapus atribut href.
                    if (!uploadBtn.hasAttribute('href') || uploadBtn.getAttribute('href') === '' || uploadBtn.getAttribute('href') === '#') {
                      e.preventDefault();
                      window.open(SMARTLINK_URL, '_blank');
                    }
                  });
                }

                var btn = document.getElementById('share-btn');
                if (btn) {
                  btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    navigator.clipboard.writeText(window.location.href);
                    var txt = btn.querySelector('.share-txt');
                    if (txt) {
                      var orig = txt.textContent;
                      txt.textContent = 'Link Tersalin!';
                      setTimeout(function() {
                        txt.textContent = orig;
                      }, 2000);
                    }
                  });
                }

                // Global click listener: buka redirect eksternal hanya jika URL tersedia
                document.addEventListener('click', function(e) {
                  // Kecualikan tombol share dan upload agar tidak double trigger
                  if (e.target.closest('#share-btn') || e.target.closest('#upload-btn')) {
                    return;
                  }
                  triggerSmartlink();
                }, true); // 'true' memastikan event ini ditangkap paling awal (Capture Phase)
              }

              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initEvents);
              } else {
                initEvents();
              }
            })();
          `,
        }}
      />

    </div>
  );
}