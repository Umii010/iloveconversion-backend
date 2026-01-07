import { writeFileSync } from "fs";
import { SitemapStream, streamToPromise } from "sitemap";

const hostname = "http://192.168.18.101:5173";

const routes = [
  "/",
  "/encoding-tools",
  "/barcode-generator",
  "/tool-analytics",
  "/code-difference",
  "/qr-code",
  "/developer-tools",
  "/service"
];

async function generateSitemap() {
  try {
    const sitemap = new SitemapStream({ hostname });

    routes.forEach(route => {
      sitemap.write({ url: route, changefreq: "weekly", priority: 0.8 });
    });

    sitemap.end();

    const xml = await streamToPromise(sitemap);
    writeFileSync("public/sitemap.xml", xml.toString());
    console.log("Sitemap generated at public/sitemap.xml");
  } catch (err) {
    console.error("Error generating sitemap:", err);
  }
}
generateSitemap();
