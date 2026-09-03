import fs from 'fs';
import readline from 'readline';

async function parseLogs() {
  const fileStream = fs.createReadStream('C:\\Users\\TOUTENUN\\.gemini\\antigravity\\brain\\470c1f4b-8cf1-48f1-b38e-d414770ea823\\.system_generated\\logs\\transcript.jsonl');
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          if (call.name === 'run_command') {
            console.log(`[Step ${obj.step_index}] CommandLine: ${call.args.CommandLine}`);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

parseLogs();
