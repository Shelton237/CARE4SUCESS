async function test() {
  try {
    const res = await fetch("http://127.0.0.1:4000/api/platform-settings");
    console.log("Status:", res.status);
    console.log("Data:", await res.json());
  } catch(e) {
    console.error(e);
  }
}
test();
