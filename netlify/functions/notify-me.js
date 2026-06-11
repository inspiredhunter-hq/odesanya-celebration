exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  var data;
  try {
    data = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }

  var email = (data.email || "").trim().toLowerCase();
  var name  = (data.name  || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  var apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  // Add or update contact in Brevo and add to list 20 (Grandma's Legacy - Notify Me)
  var payload = {
    email: email,
    listIds: [20],
    updateEnabled: true,
    attributes: {}
  };
  if (name) payload.attributes.FIRSTNAME = name;

  var response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (response.ok || response.status === 204) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }

  var errBody = await response.text();
  console.error("Brevo error:", response.status, errBody);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "Could not save your details. Please try again." })
  };
};
