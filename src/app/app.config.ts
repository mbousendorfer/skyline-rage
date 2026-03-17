import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { completeIconSet, provideAgorapulseSymbols } from '@agorapulse/ui-symbol';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideAgorapulseSymbols(completeIconSet),
    ],
};
