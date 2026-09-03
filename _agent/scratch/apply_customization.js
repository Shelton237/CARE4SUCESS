const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== URSA-CARE JITSI CUSTOMIZATION SCRIPT (HERO AT TOP) ===');

const configDir = '/root/.jitsi-meet-cfg/web';
const customInterfacePath = `${configDir}/custom-interface_config.js`;

const customInterfaceContent = `
// URSA-CARE Meet Corporate Branding Overrides
interfaceConfig.APP_NAME = 'URSA-CARE Meet';
interfaceConfig.BRAND_WATERMARK_LINK = 'https://care4success.usra-care.com';
interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL = 'https://care4success.usra-care.com/logo/Care%204%20Success-logo-Ok_compact.png';
interfaceConfig.JITSI_WATERMARK_LINK = 'https://care4success.usra-care.com';
interfaceConfig.SHOW_BRAND_WATERMARK = false;
interfaceConfig.SHOW_JITSI_WATERMARK = false;
interfaceConfig.MOBILE_APP_PROMO = false;
interfaceConfig.DISPLAY_WELCOME_FOOTER = false;
interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE = false;

// Dynamic CSS Injection for Premium Corporate Theme
(function() {
    const style = document.createElement('style');
    style.textContent = \`
        /* 1. Set a clean, professional off-white background for the overall page (bottom half) */
        html, body, #welcome_page, .welcome, .welcome-page {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-image: none !important;
            background-color: #f1f5f9 !important; /* Light clean slate */
        }
        
        /* 2. Apply the luxurious Office image STRICTLY to the top Hero Header */
        .welcome-page-header, .header {
            background-image: linear-gradient(180deg, rgba(13, 45, 90, 0.75) 0%, rgba(7, 22, 44, 0.95) 100%), url('/images/office-bg.jpg?v=top-hero') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-color: transparent !important;
            /* Ensure it has a nice smooth bottom edge or just flat */
            box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }

        /* 3. Text and Input Styling for the Hero section */
        .welcome-page-header .header-text-title {
            font-family: 'Outfit', 'Inter', sans-serif !important;
            font-weight: 900 !important;
            letter-spacing: -0.03em !important;
            text-transform: uppercase !important;
            color: #ffffff !important;
        }
        .welcome-page-header .header-text-subtitle {
            font-family: 'Inter', sans-serif !important;
            opacity: 0.95 !important;
            color: #e2e8f0 !important;
            line-height: 1.6 !important;
        }
        .welcome-page-header .enter-room-input-container {
            border-radius: 12px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        .welcome-page-header .enter-room-input {
            border-radius: 8px !important;
            border: none !important;
            color: #ffffff !important;
        }
        .welcome-page-header .join-button {
            background-color: #1A6CC8 !important;
            border-radius: 8px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            transition: all 0.3s ease !important;
        }
        .welcome-page-header .join-button:hover {
            background-color: #0D2D5A !important;
            box-shadow: 0 4px 20px rgba(26, 108, 200, 0.3) !important;
        }

        /* 4. Bottom Content Styling */
        .welcome-page-content {
            background-color: transparent !important;
            background-image: none !important;
        }
        .welcome-page-content .recent-meetings {
            background: #ffffff !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            border-radius: 16px !important;
            box-shadow: 0 10px 30px rgba(13, 45, 90, 0.05) !important;
            margin-top: 40px !important;
        }
        
        /* 5. HIDE DEFAULT JITSI LOGOS */
        .watermark, .leftwatermark, .welcome-watermark, .watermark-link, #jitsi-watermark {
            display: none !important;
        }

        /* 6. INJECT LARGE LOGO ONLY ON WELCOME PAGE */
        #welcome_page::before, .welcome-page::before {
            content: '';
            position: absolute;
            top: 30px;
            left: 40px;
            width: 300px;
            height: 100px;
            background-image: url('https://care4success.usra-care.com/logo/Care%204%20Success-logo-Ok_compact.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: left center;
            z-index: 1000;
            pointer-events: none;
        }
    \`;
    document.head.appendChild(style);
})();
`;

try {
    console.log('Writing custom-interface_config.js on the host...');
    fs.writeFileSync(customInterfacePath, customInterfaceContent);
} catch (err) {
    console.error('Error writing custom-interface_config.js:', err.message);
}

// Ensure French translation is pristine
const containerName = 'docker-jitsi-meet-web-1';
const transPath = '/usr/share/jitsi-meet/lang/main-fr.json';
try {
    const transJsonRaw = execSync(`docker exec ${containerName} cat ${transPath}`, { encoding: 'utf8' });
    const transJson = JSON.parse(transJsonRaw);
    if (transJson.welcomepage) {
        transJson.welcomepage.headerTitle = "Visioconf\u00e9rence URSA-CARE";
        transJson.welcomepage.headerSubtitle = "Plateforme de visioconf\u00e9rence et de collaboration s\u00e9curis\u00e9e pour vos r\u00e9unions, webinaires et \u00e9changes professionnels.";
    }
    const tmpTransFile = '/tmp/main-fr.json';
    fs.writeFileSync(tmpTransFile, JSON.stringify(transJson, null, 4));
    execSync(`docker cp ${tmpTransFile} ${containerName}:${transPath}`);
} catch (err) {
    console.error('Error modifying translations:', err.message);
}

// Extract, update and break CSS/JS cache in index.html
const htmlPath = '/usr/share/jitsi-meet/index.html';
try {
    let htmlContent = execSync(`docker exec ${containerName} cat ${htmlPath}`, { encoding: 'utf8' });
    
    htmlContent = htmlContent.replace(/all\.css\?v=[A-Za-z0-9-]+/g, 'all.css?v=URSACARE-top-hero1');
    htmlContent = htmlContent.replace(/interface_config\.js\?v=[A-Za-z0-9-]+/g, 'interface_config.js?v=URSACARE-top-hero1');
    htmlContent = htmlContent.replace(/config\.js\?v=[A-Za-z0-9-]+/g, 'config.js?v=URSACARE-top-hero1');

    const tmpHtmlFile = '/tmp/index.html';
    fs.writeFileSync(tmpHtmlFile, htmlContent);
    execSync(`docker cp ${tmpHtmlFile} ${containerName}:${htmlPath}`);
    console.log('index.html updated with top-hero cache breaking.');
} catch (err) {
    console.error('Error updating index.html:', err.message);
}

// Restart Jitsi Web container
try {
    execSync('docker restart docker-jitsi-meet-web-1');
} catch (err) {
    console.error('Error restarting container:', err.message);
}

console.log('=== URSA-CARE HERO AT TOP FIX APPLIED ===');
