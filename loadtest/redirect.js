// Run: k6 run -e BASE=http://localhost:3000 -e RATE=1000 loadtest/redirect.js
// setup() creates 1000 short links, then the test hits GET /:code with hot keys.
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE || "http://localhost:3000";

export const options = {
  scenarios: {
    redirects: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.RATE || 1000), // requests per second
      timeUnit: "1s",
      duration: __ENV.DURATION || "30s",
      preAllocatedVUs: 200,
      maxVUs: 1000,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<100"],
  },
};

export function setup() {
  const codes = [];
  for (let i = 0; i < 1000; i++) {
    const r = http.post(
      `${BASE}/shorten`,
      JSON.stringify({ url: `https://example.com/page/${i}` }),
      { headers: { "Content-Type": "application/json" } }
    );
    if (r.status === 201) codes.push(r.json("code"));
  }
  return { codes };
}

export default function (data) {
  // 80% of traffic goes to the hottest 20% of links
  const n = data.codes.length;
  const idx = Math.random() < 0.8 ? Math.floor(Math.random() * n * 0.2) : Math.floor(Math.random() * n);
  const res = http.get(`${BASE}/${data.codes[idx]}`, { redirects: 0 });
  check(res, { "is 302": (r) => r.status === 302 });
}
