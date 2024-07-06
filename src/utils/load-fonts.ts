import { googleFontFamilies } from './google-font-list';
import { log } from './logger';

type Weights = Set<string>;
type FontWeightsMap = Map<string, Set<string>>;

function getLoadedFonts() {
    const allFonts = Array.from(document.fonts);
    const loadedFontsMap: FontWeightsMap = new Map();

    const fontFamilies = new Set(allFonts.map((font) => font.family));

    return fontFamilies;
}

// Function to dynamically load fonts and apply CSS rules
async function loadFontFromGoogleFonts(fontFamily: string) {
    if (document.getElementById(`bold-it-font-${fontFamily}`)) {
        return;
    }
    const styleElement = document.createElement('style');

    // Base URL for Google Fonts
    const baseUrl = 'https://fonts.googleapis.com/css2?family=';

    let cssRules = '';

    const promises: Promise<void>[] = [];
    // Generate @font-face rules for each weight and style
    ['normal', 'italic'].forEach((style) => {
        [100, 200, 300, 400, 500, 600, 700, 800, 900].forEach((weight) => {
            const fontUrl = `${baseUrl}${encodeURIComponent(fontFamily)}:${
                style === 'normal' ? 'wght@' : 'ital,wght@'
            }${weight}`;

            // test url
            const testUrl = `${fontUrl}`;
            promises.push(
                fetch(testUrl)
                    .then((response) => {
                        if (!response.ok) {
                            log.message(`Failed to load font: ${fontFamily} ${style} ${weight}`);
                            return;
                        }

                        const rule = `
@font-face {
    font-family: '${fontFamily}';
    font-style: ${style};
    font-weight: ${weight};
    src: url(${fontUrl}) format('woff2');
}`.trim();
                        cssRules += rule;
                    })
                    .catch((error) => {
                        log.message(`Failed to load font: ${fontFamily} ${style} ${weight}`);
                    })
            );
        });
    });
    await Promise.allSettled(promises);

    styleElement.id = `bold-it-font-${fontFamily}`;
    styleElement.textContent = cssRules;
    document.head.appendChild(styleElement);
}

export function loadFonts() {
    const fontFamilies = getLoadedFonts();
    for (const fontFamily of fontFamilies) {
        if (googleFontFamilies.includes(fontFamily)) {
            loadFontFromGoogleFonts(fontFamily);
        }
    }
}
