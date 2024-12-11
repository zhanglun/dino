const { exec } = require("child_process");

let intervalId;
let cooldownTimer;

function startScript() {
  const command =
    "sui client faucet --address=0x7461d317c48d5bbb5fc29a453ed5e2c4e8000828cf2e2b8c41aa99685e91fcfd";

  function executeCommand() {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (
          !error.message.includes(
            "[warning] Client/Server api version mismatch"
          )
        ) {
          console.error(`Error executing command: ${error}`);
          return;
        }
      }
      console.log(`Command output: ${stdout}`);

      if (
        stdout.includes(
          "Faucet service received too many requests from this IP address. Please try again after 60 minutes."
        )
      ) {
        console.log("Rate limit reached. Restarting cooldown timer.");
        if (cooldownTimer) clearTimeout(cooldownTimer);
        cooldownTimer = setTimeout(executeCommand, 61 * 60 * 1000);
      }
    });
  }

  intervalId = setInterval(executeCommand, 61 * 60 * 1000);
  console.log("Faucet script started. Running every 61 minutes.");
  executeCommand();
}

function stopScript() {
  if (intervalId) {
    clearInterval(intervalId);
    if (cooldownTimer) clearTimeout(cooldownTimer);
    console.log("Faucet script stopped.");
  } else {
    console.log("No faucet script is currently running.");
  }
}

if (process.argv[2] === "start") {
  startScript();
} else if (process.argv[2] === "stop") {
  stopScript();
} else {
  console.log("Usage: node faucet.js [start|stop]");
}
