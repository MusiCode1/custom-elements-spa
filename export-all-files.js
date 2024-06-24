const fs = require('fs');
const path = require('path');

// הגדרת התיקייה שממנה נרצה לייצא את הקבצים
const sourceDir = '.';
// הגדרת קובץ היעד
const outputFile = 'output.txt';

// פונקציה רקורסיבית לקריאת כל הקבצים בתיקייה ובתתי-התיקיות שלה
function readFilesRecursively(dir) {
    let results = '';
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // אם זו תיקייה, קורא לפונקציה באופן רקורסיבי
            results += readFilesRecursively(filePath);
        } else {
            // אם זה קובץ, קורא את תוכנו ומוסיף אותו לתוצאה
            results += `\n\n--- File: ${filePath} ---\n\n`;
            results += fs.readFileSync(filePath, 'utf8');
        }
    }
    
    return results;
}

try {
    // קריאה רקורסיבית של כל הקבצים בתיקיית המקור
    const content = readFilesRecursively(sourceDir);
    
    // כתיבת התוכן לקובץ היעד
    fs.writeFileSync(outputFile, content);
    
    console.log(`כל הקבצים מתחת ל-${sourceDir} יוצאו בהצלחה לקובץ ${outputFile}`);
} catch (error) {
    console.error('אירעה שגיאה:', error);
}