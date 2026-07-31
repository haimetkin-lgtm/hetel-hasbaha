import { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://haimetkin-lgtm.github.io/hetel-hasbaha";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/check`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];
}
