import { ButtonComponent } from '@agorapulse/ui-components/button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { SlideToggleComponent } from '@agorapulse/ui-components/slide-toggle';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ProfilesPanelComponent } from './profiles-panel/profiles-panel';
import { ComposePanelComponent } from './compose-panel/compose-panel';
import { PreviewPanelComponent } from './preview-panel/preview-panel';
import { ComposeStateService } from './compose-state';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-create-post',
    imports: [ButtonComponent, IconButtonComponent, SlideToggleComponent, TooltipDirective, SymbolComponent, ProfilesPanelComponent, ComposePanelComponent, PreviewPanelComponent],
    template: `
        <div class="modal-container">
            <div class="modal-header">
                <h2 class="modal-title">Create post</h2>
                <div class="header-actions">
                    <ap-icon-button symbolId="history" ariaLabel="History" type="flat" [apTooltip]="'Post history'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                    <ap-icon-button symbolId="refresh" ariaLabel="Redo" type="flat" [apTooltip]="'Redo'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                    <div class="divider"></div>
                    <ap-icon-button symbolId="close" ariaLabel="Close" type="flat" (onClick)="close.emit()"></ap-icon-button>
                </div>
            </div>

            <div class="modal-body">
                <app-profiles-panel></app-profiles-panel>
                <app-compose-panel></app-compose-panel>
                <app-preview-panel></app-preview-panel>
            </div>

            <div class="modal-footer">
                <div class="footer-left">
                    <!-- Campaign button: shows name when set, triggers mock modal otherwise -->
                    <ap-button
                        [config]="{ style: 'stroked', color: state.activeCampaign() ? 'blue' : 'grey' }"
                        symbolId="megaphone"
                        symbolPosition="left"
                        size="small"
                        [apTooltip]="state.activeCampaign() ? 'Change advocacy campaign' : 'Link this post to an advocacy campaign'"
                        apTooltipPosition="top"
                        [apTooltipShowDelay]="400"
                        (click)="state.activeCampaign.set('Summer Promo 2025')">
                        {{ state.activeCampaign() || 'Advocacy campaign' }}
                    </ap-button>

                    <!-- "No campaign" only when a campaign is set -->
                    @if (state.activeCampaign()) {
                        <ap-button
                            [config]="{ style: 'stroked', color: 'grey' }"
                            symbolId="close"
                            symbolPosition="left"
                            size="small"
                            [apTooltip]="'Remove campaign attribution'"
                            apTooltipPosition="top"
                            [apTooltipShowDelay]="400"
                            (click)="state.activeCampaign.set(null)">
                            No campaign
                        </ap-button>
                    }

                    <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="check" symbolPosition="left" size="small" [apTooltip]="'Require approval before publishing'" apTooltipPosition="top" [apTooltipShowDelay]="400">Select approval type</ap-button>
                    <div class="footer-divider"></div>
                    <label class="draft-toggle" [class.active]="state.isDraft()" [apTooltip]="'Save as draft — post will not be published yet'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                        <ap-slide-toggle [checked]="state.isDraft()" (checkedChange)="state.isDraft.set($event)" size="small"></ap-slide-toggle>
                        <span class="draft-label">Draft</span>
                    </label>
                </div>
                <div class="footer-right">
                    @if (!state.isDraft()) {
                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="calendar" symbolPosition="left" size="small" class="date-time-btn">Date &amp; Time</ap-button>
                        <ap-button [config]="{ style: 'primary', color: 'orange' }" symbolId="chevron-down" symbolPosition="right" size="small" class="schedule-btn">Schedule</ap-button>
                    } @else {
                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="floppy-disk" symbolPosition="left" size="small" class="save-draft-btn">Save draft</ap-button>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .modal-container {
            display: flex; flex-direction: column;
            width: 100%; height: 100%;
            background: var(--ref-color-white);
            overflow: hidden;
        }
        .modal-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 14px;
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white);
        }
        .modal-title { font-size: 15px; font-weight: 600; color: var(--sys-text-color-default); margin: 0; }
        .header-actions { display: flex; align-items: center; gap: 2px; }
        .divider { width: 1px; height: 18px; background: var(--sys-border-color-default); margin: 0 4px; }
        .modal-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .modal-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 14px;
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white); gap: 12px;
        }
        .footer-left { display: flex; align-items: center; gap: 6px; }
        .footer-right { display: flex; align-items: center; gap: 8px; }
        .footer-divider { width: 1px; height: 18px; background: var(--sys-border-color-default); margin: 0 2px; }
        .draft-toggle {
            display: flex; align-items: center; gap: 6px; cursor: pointer;
            padding: 3px 8px 3px 4px; border-radius: 6px; transition: background 0.15s;
            &.active { background: var(--ref-color-grey-10); }
        }
        .draft-label { font-size: 12px; font-weight: 500; color: var(--sys-text-color-light); }

        /* Make Date & Time button connect seamlessly to Schedule */
        .date-time-btn {
            ::ng-deep button { border-radius: 6px 0 0 6px !important; border-right: none !important; }
        }
        .schedule-btn {
            ::ng-deep button { border-radius: 0 6px 6px 0 !important; }
        }
    `],
})
export class CreatePostComponent {
    close = output<void>();
    state = inject(ComposeStateService);
}
