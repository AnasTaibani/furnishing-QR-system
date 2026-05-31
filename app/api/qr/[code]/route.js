import QRCode from 'qrcode';

export async function GET(request, { params }) {
  try {
    const code = params.code;

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/p/${code}`;

    const pngBuffer = await QRCode.toBuffer(url, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    console.error(err);

    return new Response('QR generation failed', {
      status: 500,
    });
  }
}