const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\shingo\\AppData\\Roaming\\Code\\User\\History';

function searchDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDirectory(fullPath);
    } else if (stat.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('export const EventEditView: React.FC') && content.length > 5000) {
          console.log(`Found candidate: ${fullPath} (${content.length} bytes), Last Modified: ${stat.mtime}`);
          // write it to a temporary file
          fs.writeFileSync('C:\\Users\\shingo\\Desktop\\amidakuji-app\\recovered_EventEditView_candidate.txt', content);
          console.log('Saved to recovered_EventEditView_candidate.txt');
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

searchDirectory(historyDir);
console.log('Done searching.');
