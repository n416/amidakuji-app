const fs = require('fs');

const path = 'C:\\Users\\shingo\\.gemini\\antigravity\\brain\\7e9877bc-bb86-4518-8af2-4ea5b0539d81\\.system_generated\\logs\\overview.txt';
const logData = fs.readFileSync(path, 'utf-8');
const lines = logData.split('\n');

for (const line of lines) {
  if (line.includes('replace_file_content') && line.includes('ParticipantView.tsx')) {
    try {
      const parsed = JSON.parse(line);
      for (const call of parsed.tool_calls) {
        if ((call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') && call.args.TargetFile.includes('ParticipantView.tsx')) {
          if (call.args.ReplacementContent && call.args.ReplacementContent.length > 1000) {
            fs.writeFileSync('C:\\Users\\shingo\\Desktop\\amidakuji-app\\recovered_ParticipantView.txt', call.args.ReplacementContent);
            console.log('Saved to recovered_ParticipantView.txt!');
          }
          if (call.args.ReplacementChunks) {
            const chunks = JSON.parse(call.args.ReplacementChunks);
            for (const chunk of chunks) {
              if (chunk.ReplacementContent && chunk.ReplacementContent.length > 1000) {
                 fs.writeFileSync('C:\\Users\\shingo\\Desktop\\amidakuji-app\\recovered_ParticipantView_chunk.txt', chunk.ReplacementContent);
                 console.log('Saved chunk!');
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
console.log('Done.');
