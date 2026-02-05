export async function GET({ site }) {
  if (!site) {
    return new Response(
      "RSS feed requires `site` to be set in astro.config.mjs",
      { status: 500 },
    );
  }

  const posts = await import.meta.glob("./blog/*.{md,mdx}", {
    eager: true,
  });

  const items = Object.values(posts)
    .map((post) => ({
      title: post.frontmatter?.title || "Untitled",
      description: post.frontmatter?.description || "",
      pubDate: post.frontmatter?.pubDate
        ? new Date(post.frontmatter.pubDate)
        : new Date(),
      url: new URL(post.url, site).toString(),
    }))
    .sort((a, b) => b.pubDate - a.pubDate);

  const escape = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const feedItems = items
    .map(
      (item) => `\n    <item>\n      <title>${escape(
        item.title,
      )}</title>\n      <link>${escape(
        item.url,
      )}</link>\n      <guid>${escape(
        item.url,
      )}</guid>\n      <pubDate>${item.pubDate.toUTCString()}</pubDate>\n      <description>${escape(
        item.description,
      )}</description>\n    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Luka Mucko</title>\n    <link>${escape(
      site.toString(),
    )}</link>\n    <description>Blog posts</description>\n    <language>en</language>${feedItems}\n  </channel>\n</rss>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
