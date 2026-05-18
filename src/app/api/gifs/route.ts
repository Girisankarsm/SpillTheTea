import { NextResponse } from "next/server";

type GiphyImage = {
  fixed_height?: { url?: string; width?: string; height?: string };
  fixed_height_small?: { url?: string };
  original?: { url?: string };
};

type GiphyGif = {
  id: string;
  title: string;
  images: GiphyImage;
};

export type GifItem = {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
};

function mapGif(g: GiphyGif): GifItem | null {
  const previewUrl =
    g.images.fixed_height_small?.url ??
    g.images.fixed_height?.url ??
    g.images.original?.url;
  const url = g.images.original?.url ?? g.images.fixed_height?.url;
  if (!previewUrl || !url) return null;
  return {
    id: g.id,
    title: g.title || "GIF",
    previewUrl,
    url,
  };
}

export async function GET(request: Request) {
  const apiKey = process.env.GIPHY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GIF search is not configured. Add GIPHY_API_KEY to .env.local." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const endpoint = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&limit=24&rating=g&lang=en`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(apiKey)}&limit=24&rating=g`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not load GIFs right now." },
        { status: 502 },
      );
    }
    const json = (await res.json()) as { data?: GiphyGif[] };
    const gifs = (json.data ?? [])
      .map(mapGif)
      .filter((g): g is GifItem => g !== null);
    return NextResponse.json({ gifs });
  } catch {
    return NextResponse.json(
      { error: "Could not load GIFs right now." },
      { status: 502 },
    );
  }
}
