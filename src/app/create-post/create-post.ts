import { ButtonComponent } from '@agorapulse/ui-components/button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { SlideToggleComponent } from '@agorapulse/ui-components/slide-toggle';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
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
                    <ap-icon-button
                        symbolId="history"
                        ariaLabel="Post history"
                        type="flat"
                        [class.panel-btn-active]="rightPanel() === 'history'"
                        [apTooltip]="'Post modification history'"
                        apTooltipPosition="bottom"
                        [apTooltipShowDelay]="400"
                        (onClick)="togglePanel('history')">
                    </ap-icon-button>
                    <button
                        class="conversation-btn"
                        [class.panel-btn-active]="rightPanel() === 'conversation'"
                        [apTooltip]="'Post conversation'"
                        apTooltipPosition="bottom"
                        [apTooltipShowDelay]="400"
                        (click)="togglePanel('conversation')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 2.8A.8.8 0 0 1 2.8 2h10.4a.8.8 0 0 1 .8.8v7.6a.8.8 0 0 1-.8.8H5.731L3.2 13.731V11.2H2.8a.8.8 0 0 1-.8-.8V2.8ZM2.8.4A2.4 2.4 0 0 0 .4 2.8v7.6a2.4 2.4 0 0 0 2.4 2.4v2.069a.8.8 0 0 0 1.365.566L7.069 11.2H13.2a2.4 2.4 0 0 0 2.4-2.4V2.8A2.4 2.4 0 0 0 13.2.4H2.8Z" fill="currentColor"/>
                        </svg>
                    </button>
                    <div class="divider"></div>
                    <ap-icon-button symbolId="close" ariaLabel="Close" type="flat" (onClick)="close.emit()"></ap-icon-button>
                </div>
            </div>

            <div class="modal-body">
                <app-profiles-panel></app-profiles-panel>
                <app-compose-panel></app-compose-panel>
                <app-preview-panel></app-preview-panel>

                <!-- ── Right panel (history / conversation) ── -->
                @if (rightPanel() !== null) {
                    <div class="right-panel">
                        <div class="right-panel-header">
                            <span class="right-panel-title">{{ rightPanel() === 'history' ? 'Post history' : 'Conversation' }}</span>
                            <button class="right-panel-close" (click)="rightPanel.set(null)">
                                <ap-symbol symbolId="close" size="xs" color="basic-grey"></ap-symbol>
                            </button>
                        </div>

                        @if (rightPanel() === 'history') {
                            <div class="right-panel-body">
                                @for (entry of historyEntries; track entry.id) {
                                    <div class="history-entry">
                                        <div class="history-avatar">{{ entry.initials }}</div>
                                        <div class="history-content">
                                            <div class="history-action">{{ entry.action }}</div>
                                            <div class="history-meta">{{ entry.author }} · {{ entry.time }}</div>
                                            @if (entry.diff) {
                                                <div class="history-diff">{{ entry.diff }}</div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        }

                        @if (rightPanel() === 'conversation') {
                            <div class="right-panel-body">
                                @for (msg of conversationMessages; track msg.id) {
                                    <div class="conv-message">
                                        <div class="conv-avatar">{{ msg.initials }}</div>
                                        <div class="conv-content">
                                            <div class="conv-header">
                                                <span class="conv-author">{{ msg.author }}</span>
                                                <span class="conv-time">{{ msg.time }}</span>
                                            </div>
                                            <div class="conv-text">{{ msg.text }}</div>
                                            @if (msg.resolved) {
                                                <span class="conv-resolved">Resolved</span>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                            <div class="conv-input-row">
                                <textarea class="conv-input" placeholder="Add a comment…" rows="2"></textarea>
                                <button class="conv-send">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M14.4 7.134 2.4 1.134A.8.8 0 0 0 1.334 2.2L3.2 8l-1.866 5.8A.8.8 0 0 0 2.4 14.866l12-6a.8.8 0 0 0 0-1.732Z" fill="currentColor"/>
                                    </svg>
                                </button>
                            </div>
                        }
                    </div>
                }
            </div>

            <div class="modal-footer">
                <div class="footer-left">
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

        /* Conversation button (custom, matches ap-icon-button flat style) */
        .conversation-btn {
            width: 32px; height: 32px; border: none; background: none; border-radius: 6px;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            color: var(--sys-text-color-light); transition: background 0.15s, color 0.15s;
            padding: 0;
            &:hover { background: var(--ref-color-grey-05); color: var(--sys-text-color-default); }
        }

        /* Active state for panel toggle buttons */
        .panel-btn-active {
            ::ng-deep button { background: var(--ref-color-electric-blue-05) !important; color: var(--ref-color-electric-blue-100) !important; }
        }
        .conversation-btn.panel-btn-active {
            background: var(--ref-color-electric-blue-05); color: var(--ref-color-electric-blue-100);
        }

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

        .date-time-btn {
            ::ng-deep button { border-radius: 6px 0 0 6px !important; border-right: none !important; }
        }
        .schedule-btn {
            ::ng-deep button { border-radius: 0 6px 6px 0 !important; }
        }

        /* ── Right panel ── */
        .right-panel {
            width: 300px; flex-shrink: 0;
            border-left: 1px solid var(--sys-border-color-default);
            display: flex; flex-direction: column;
            background: var(--ref-color-white);
            animation: slideIn 0.18s ease-out;
        }
        @keyframes slideIn {
            from { width: 0; opacity: 0; }
            to   { width: 300px; opacity: 1; }
        }
        .right-panel-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 14px; border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .right-panel-title { font-size: 13px; font-weight: 700; color: var(--sys-text-color-default); }
        .right-panel-close {
            width: 24px; height: 24px; border: none; background: none; border-radius: 4px;
            cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
            &:hover { background: var(--ref-color-grey-05); }
        }
        .right-panel-body {
            flex: 1; overflow-y: auto; padding: 12px 14px;
            display: flex; flex-direction: column; gap: 16px;
        }

        /* History entries */
        .history-entry { display: flex; gap: 10px; align-items: flex-start; }
        .history-avatar {
            width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
            background: var(--ref-color-electric-blue-10); color: var(--ref-color-electric-blue-100);
            font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        .history-content { flex: 1; }
        .history-action { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); line-height: 1.4; }
        .history-meta { font-size: 11px; color: var(--ref-color-grey-60); margin-top: 1px; }
        .history-diff {
            margin-top: 6px; padding: 6px 8px; border-radius: 4px;
            background: var(--ref-color-grey-02); border: 1px solid var(--ref-color-grey-10);
            font-size: 11px; color: var(--sys-text-color-default); line-height: 1.5;
        }

        /* Conversation messages */
        .conv-message { display: flex; gap: 10px; align-items: flex-start; }
        .conv-avatar {
            width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
            background: var(--ref-color-grey-10); color: var(--sys-text-color-default);
            font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        .conv-content { flex: 1; }
        .conv-header { display: flex; align-items: baseline; gap: 6px; margin-bottom: 3px; }
        .conv-author { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
        .conv-time { font-size: 11px; color: var(--ref-color-grey-60); }
        .conv-text { font-size: 12px; color: var(--sys-text-color-default); line-height: 1.5; }
        .conv-resolved {
            display: inline-block; margin-top: 4px; font-size: 10px; font-weight: 600;
            color: var(--ref-color-green-100, #16a34a); background: var(--ref-color-green-05, #f0fdf4);
            border-radius: 4px; padding: 1px 6px;
        }
        .conv-input-row {
            display: flex; gap: 8px; align-items: flex-end;
            padding: 10px 14px; border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .conv-input {
            flex: 1; padding: 8px 10px; border: 1px solid var(--sys-border-color-default);
            border-radius: 6px; font-size: 12px; font-family: 'Averta', sans-serif;
            resize: none; outline: none; background: var(--ref-color-white);
            color: var(--sys-text-color-default);
            &::placeholder { color: var(--ref-color-grey-60); }
            &:focus { border-color: var(--ref-color-electric-blue-60); }
        }
        .conv-send {
            width: 32px; height: 32px; border-radius: 6px; border: none;
            background: var(--ref-color-electric-blue-100); color: white;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            flex-shrink: 0; transition: background 0.15s;
            &:hover { background: var(--ref-color-electric-blue-80); }
        }
    `],
})
export class CreatePostComponent {
    close = output<void>();
    state = inject(ComposeStateService);

    rightPanel = signal<'history' | 'conversation' | null>(null);

    togglePanel(panel: 'history' | 'conversation'): void {
        this.rightPanel.update(current => current === panel ? null : panel);
    }

    readonly historyEntries = [
        { id: 1, initials: 'MB', author: 'Matt B.', time: '2 min ago', action: 'Post text modified', diff: '"J\'aime beaucoup cette salle de bain"' },
        { id: 2, initials: 'MB', author: 'Matt B.', time: '8 min ago', action: 'Media added', diff: null },
        { id: 3, initials: 'MB', author: 'Matt B.', time: '12 min ago', action: 'Facebook customization added', diff: null },
        { id: 4, initials: 'MB', author: 'Matt B.', time: '15 min ago', action: 'Draft saved', diff: null },
        { id: 5, initials: 'SW', author: 'Sarah W.', time: '1 hr ago', action: 'Post created', diff: null },
    ];

    readonly conversationMessages = [
        { id: 1, initials: 'SW', author: 'Sarah W.', time: '1 hr ago', text: 'Can you double-check the caption for Instagram? The hashtags might need updating.', resolved: false },
        { id: 2, initials: 'MB', author: 'Matt B.', time: '45 min ago', text: 'Good point — I\'ll update the hashtags and add a couple more relevant ones.', resolved: false },
        { id: 3, initials: 'SW', author: 'Sarah W.', time: '30 min ago', text: 'Also the Facebook boost — are we targeting the right audience?', resolved: true },
    ];
}
