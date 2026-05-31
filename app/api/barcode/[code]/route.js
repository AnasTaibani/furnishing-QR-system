import bwipjs from 'bwip-js';

export async function GET(request, { params }) {
  try {
    const code = params.code;

    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    console.error(err);

    return new Response('Barcode generation failed', {
      status: 500,
    });
  }
}