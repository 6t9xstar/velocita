import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
export async function GET(context) {
  const posts = await getCollection("blog");
  return rss({
    title: "Bench", description: "Bench feed", site: context.site,
    items: posts.map((p) => ({ title: p.data.title, pubDate: p.data.date, description: p.data.description, link: `/blog/${p.id}/` })),
  });
}
