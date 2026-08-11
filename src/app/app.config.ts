import { provideAnimations } from '@angular/platform-browser/animations';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { completeIconSet, provideAgorapulseSymbols } from '@agorapulse/ui-symbol';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideAgorapulseSymbols(completeIconSet),
        // Required by DS components that animate — Snackbars Thread uses the
        // @fadeAnimation synthetic property and throws NG05105 without this.
        provideAnimations(),
    ],
};
