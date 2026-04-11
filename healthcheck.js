const http = require("http");

/**
 * Script kiểm tra trạng thái sức khỏe của Service
 * Được gọi bởi Docker để giám sát container
 */
const options = {
  host: "localhost",
  port: process.env.PORT || 3002,
  path: "/health", // Endpoint trả về trạng thái ok
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`HEALTHCHECK STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0); // Thành công
  } else {
    process.exit(1); // Thất bại
  }
});

request.on("error", function (err) {
  console.log("HEALTHCHECK ERROR: Service unreachable");
  process.exit(1);
});

request.end();
