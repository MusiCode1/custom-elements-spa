
import { registerComponent } from './core/componentFactory.js';
import { Router } from './core/router.js';

async function initApp() {
    // רישום הקומפוננטות
    await registerComponent('app-home', 'src/pages/main.html');
    await registerComponent('app-about', 'src/pages/about.html');
    await registerComponent('app-todo', 'src/pages/todo.html');
    await registerComponent('app-nav', 'src/components/nav.html');
    await registerComponent('app-footer', 'src/components/footer.html');


    // יצירת אלמנט השורש של האפליקציה
    const rootElement = document.getElementById('app') || document.body;

    // יצירת והוספת ניווט
    const navElement = document.createElement('app-nav');
    rootElement.appendChild(navElement);

    // יצירת אלמנט לתוכן הדינמי
    const contentElement = document.createElement('div');
    contentElement.id = 'content';
    rootElement.appendChild(contentElement);

    const footerElement = document.createElement('app-footer');
    rootElement.appendChild(footerElement);

    // אתחול הראוטר
    const router = new Router(contentElement);
    router.addRoute('/', 'app-home');
    router.addRoute('/about', 'app-about');
    router.addRoute('/todo', 'app-todo');
    router.addRoute('*', 'app-home'); // דף ברירת מחדל

    // הוספת אירועי ניווט לקישורים
    navElement.addEventListener('navigate', (event) => {
        router.navigateTo(event.detail.path);
    });

    // אתחול הראוטר
    router.init();
}

// הפעלת האפליקציה כאשר ה-DOM נטען
document.addEventListener('DOMContentLoaded', initApp);