const fs = require("fs");

// Define your token
const token = process.env.MAPBOX_TOKEN || "";

async function modifyScriptFile() {
  try {
    // Read the content of the script.js file
    let data = await fs.promises.readFile("static/script.js", "utf8");

    // Replace the placeholder string in the script.js file with your token
    const modifiedData = data.replace("$YOUR_MAPBOX_TOKEN_HERE$", token);

    // Write the modified content back to the script.js file
    await fs.promises.writeFile("static/script.js", modifiedData, "utf8");

    console.log(
      "Script.js file has been successfully modified with the token."
    );
  } catch (error) {
    console.error("Error modifying script.js:", error);
  }
}

modifyScriptFile();
