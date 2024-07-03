const fs = require('fs');
const path = require('path');

// הגדרת התיקייה שממנה נרצה לייצא את הקבצים
const sourceDir = '.';
// הגדרת קובץ היעד
const outputFile = './temp/output.md';

// רשימת התעלמות - הוסף כאן קבצים ותיקיות שברצונך לדלג עליהם
const ignoreList = [
    'node_modules',
    '.git',
    'temp',
    '.DS_Store',
    'package-lock.json',
    outputFile // מתעלם מקובץ הפלט עצמו
];

// פונקציה לבדיקה האם יש להתעלם מקובץ או תיקייה
function shouldIgnore(filePath) {
    return ignoreList.some(item => filePath.includes(item));
}

// פונקציה רקורסיבית לקריאת כל הקבצים בתיקייה ובתתי-התיקיות שלה
function readFilesRecursively(dir) {

    let results = '';

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);

        // בדיקה האם יש להתעלם מהקובץ או התיקייה
        if (shouldIgnore(filePath)) {
            continue;
        }

        const stat = fs.statSync(filePath);
        const ext = path.extname(filePath)?.slice(1);

        if (stat.isDirectory()) {
            // אם זו תיקייה, קורא לפונקציה באופן רקורסיבי
            results += readFilesRecursively(filePath);
        } else {
            // אם זה קובץ, קורא את תוכנו ומוסיף אותו לתוצאה
            results += `## File name: ${filePath}\n\n`;
            results += "```" + ext + "\n";
            results += fs.readFileSync(filePath, 'utf8');
            results += "\n```\n\n";
        }
    }

    return results;
}

try {

    let content = '# Files';
    content += '\n';
    content += 'בקובץ זה ניתן לראות את כל הקבצים בפרוייקט PureJS SPA.';
    content += '\n\n';
    // קריאה רקורסיבית של כל הקבצים בתיקיית המקור
    content += readFilesRecursively(sourceDir);

    // כתיבת התוכן לקובץ היעד
    fs.writeFileSync(outputFile, content);

    console.log(`כל הקבצים מתחת ל-${sourceDir} יוצאו בהצלחה לקובץ ${outputFile}`);
} catch (error) {
    console.error('אירעה שגיאה:', error);
}