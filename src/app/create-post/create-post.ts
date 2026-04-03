import { ButtonComponent } from '@agorapulse/ui-components/button';
import { CloseButtonComponent } from '@agorapulse/ui-components/close-button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { TabsComponent, TabComponent } from '@agorapulse/ui-components/tabs';
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
    imports: [ButtonComponent, CloseButtonComponent, IconButtonComponent, TabsComponent, TabComponent, TooltipDirective, SymbolComponent, ProfilesPanelComponent, ComposePanelComponent, PreviewPanelComponent],
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
                    <ap-icon-button
                        type="flat"
                        symbolId="single-chat-bubble"
                        ariaLabel="Post conversation"
                        [class.panel-btn-active]="rightPanel() === 'conversation'"
                        [apTooltip]="'Post conversation'"
                        apTooltipPosition="bottom"
                        [apTooltipShowDelay]="400"
                        (onClick)="togglePanel('conversation')">
                    </ap-icon-button>
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
                            <span class="right-panel-title">{{ rightPanel() === 'history' ? 'Post history' : 'Post conversation' }}</span>
                            <ap-close-button (closed)="rightPanel.set(null)"></ap-close-button>
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
                            @if (conversationMessages.length > 0) {
                                <div class="right-panel-body conv-body">
                                    @for (msg of conversationMessages; track msg.id) {
                                        <div class="conv-msg">
                                            <div class="conv-msg-row">
                                                <div class="conv-avatar">{{ msg.initials }}</div>
                                                <div class="conv-msg-meta">
                                                    <span class="conv-author">{{ msg.author }}</span>
                                                    <span class="conv-time">{{ msg.time }}</span>
                                                </div>
                                                <span class="conv-badge" [class.internal]="msg.type === 'Internal'" [class.external]="msg.type === 'External'">{{ msg.type }}</span>
                                                <ap-icon-button class="conv-reply-btn" type="flat" size="small" symbolId="reply" ariaLabel="Reply" [apTooltip]="'Reply to this message'" apTooltipPosition="left" [apTooltipShowDelay]="400" (onClick)="replyingTo.set(msg.id)"></ap-icon-button>
                                            </div>
                                            <div class="conv-msg-content">
                                                @if (msg.replyToId) {
                                                    <div class="conv-reply-quote">{{ getMessageById(msg.replyToId)?.text }}</div>
                                                }
                                                <div class="conv-text">{{ msg.text }}</div>
                                                @if (msg.attachments?.length) {
                                                    <div class="conv-attachments">
                                                        @for (att of msg.attachments; track att.name) {
                                                            <div class="conv-attachment">
                                                                <ap-symbol symbolId="paper-clip" size="xs" color="basic-grey"></ap-symbol>
                                                                <span class="conv-att-name">{{ att.name }}</span>
                                                                <span class="conv-att-size">{{ att.size }}</span>
                                                                <ap-icon-button type="flat" size="small" symbolId="download" ariaLabel="Download"></ap-icon-button>
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            } @else {
                                <div class="conv-empty">
                                    <ap-symbol symbolId="single-chat-bubble" size="lg" color="basic-grey"></ap-symbol>
                                    <p class="conv-empty-text">No comments yet, be the first to add one</p>
                                    <ap-button [config]="{style:'ghost',color:'blue'}" size="small">Add a comment</ap-button>
                                </div>
                            }
                            <div class="conv-composer">
                                @if (replyingTo()) {
                                    <div class="conv-reply-strip">
                                        <div class="conv-reply-strip-content">
                                            <ap-symbol symbolId="reply" size="xs" color="basic-grey"></ap-symbol>
                                            <span>Replying to <strong>{{ getMessageById(replyingTo()!)?.author }}</strong></span>
                                        </div>
                                        <ap-icon-button type="flat" size="small" symbolId="close" ariaLabel="Cancel reply" (onClick)="replyingTo.set(null)"></ap-icon-button>
                                    </div>
                                }
                                <ap-tabs class="conv-composer-tabs"
                                    [selectedIndex]="convTab() === 'internal' ? 0 : 1"
                                    (tabChange)="convTab.set($event.index === 0 ? 'internal' : 'external')">
                                    <ap-tab label="Internal"></ap-tab>
                                    <ap-tab label="External"></ap-tab>
                                </ap-tabs>
                                <textarea class="conv-textarea" placeholder="Write a comment..." rows="3"></textarea>
                                @if (pendingAttachments().length) {
                                    <div class="conv-pending-attachments">
                                        @for (att of pendingAttachments(); track att.name; let i = $index) {
                                            <div class="conv-pending-chip">
                                                <ap-symbol symbolId="paper-clip" size="xs" color="basic-grey"></ap-symbol>
                                                <span>{{ att.name }}</span>
                                                <ap-icon-button type="flat" size="small" symbolId="close" ariaLabel="Remove" (onClick)="removeAttachment(i)"></ap-icon-button>
                                            </div>
                                        }
                                    </div>
                                }
                                <div class="conv-composer-footer">
                                    <div class="conv-composer-actions">
                                        <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat"></ap-icon-button>
                                        <ap-icon-button symbolId="paper-clip" ariaLabel="Attach file" type="flat" (onClick)="attachFileInput.click()"></ap-icon-button>
                                        <input #attachFileInput type="file" multiple style="display:none" (change)="onAttachFiles($event)">
                                    </div>
                                    <ap-button [config]="{ style: 'primary', color: 'blue' }" size="small">
                                        {{ convTab() === 'internal' ? 'Send internally' : 'Send externally' }}
                                    </ap-button>
                                </div>
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
                            [apTooltip]="'Remove campaign attribution'"
                            apTooltipPosition="top"
                            [apTooltipShowDelay]="400"
                            (click)="state.activeCampaign.set(null)">
                            No campaign
                        </ap-button>
                    }

                    <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="check" symbolPosition="left" [apTooltip]="'Require approval before publishing'" apTooltipPosition="top" [apTooltipShowDelay]="400">Select approval type</ap-button>
                </div>
                <div class="footer-right">
                    @if (!state.isDraft()) {
                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="calendar" symbolPosition="left" class="date-time-btn">Date &amp; Time</ap-button>
                        <ap-button [config]="{ style: 'primary', color: 'orange' }" symbolId="chevron-down" symbolPosition="right" class="schedule-btn">Schedule</ap-button>
                    } @else {
                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="bookmark" symbolPosition="left" class="save-draft-btn">Save draft</ap-button>
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
            padding: 8px 16px;
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white);
        }
        .modal-title { font-size: var(--ref-font-size-lg); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); margin: 0; }
        .header-actions { display: flex; align-items: center; gap: 2px; }
        .divider { width: 1px; height: 18px; background: var(--sys-border-color-default); margin: 0 4px; }

        /* Active state for panel toggle buttons */
        .panel-btn-active {
            ::ng-deep button { background: var(--ref-color-electric-blue-10) !important; color: var(--ref-color-electric-blue-100) !important; }
        }

.modal-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .modal-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 16px;
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white); gap: 12px;
        }
        .footer-left { display: flex; align-items: center; gap: 6px; }
        .footer-right { display: flex; align-items: center; gap: 8px; }

        .date-time-btn {
            ::ng-deep button { border-radius: var(--comp-button-border-radius) 0 0 var(--comp-button-border-radius) !important; border-right: none !important; }
        }
        .schedule-btn {
            ::ng-deep button { border-radius: 0 var(--comp-button-border-radius) var(--comp-button-border-radius) 0 !important; }
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
        .right-panel-title { font-size: var(--ref-font-size-md); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .right-panel-body {
            flex: 1; overflow-y: auto; padding: 12px 14px;
            display: flex; flex-direction: column; gap: 16px;
        }

        /* History entries */
        .history-entry { display: flex; gap: 8px; align-items: flex-start; }
        .history-avatar {
            width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
            background: var(--ref-color-electric-blue-10); color: var(--ref-color-electric-blue-100);
            font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); display: flex; align-items: center; justify-content: center;
        }
        .history-content { flex: 1; }
        .history-action { font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); line-height: var(--ref-font-line-height-xs); }
        .history-meta { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); }
        .history-diff {
            margin-top: 6px; padding: 6px 8px; border-radius: var(--ref-radius-sm);
            background: var(--ref-color-grey-bg); border: 1px solid var(--ref-color-grey-10);
            font-size: var(--ref-font-size-xs); color: var(--sys-text-color-default); line-height: var(--ref-font-line-height-xs);
        }

        /* ── Conversation messages ── */
        .conv-body { gap: 0; padding: 0; }
        .conv-msg {
            padding: 12px 14px;
            border-bottom: 1px solid var(--ref-color-grey-05);
            &:last-child { border-bottom: none; }
            &:hover .conv-reply-btn { opacity: 1; }
        }
        .conv-msg-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .conv-avatar {
            width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
            background: var(--ref-color-electric-blue-10); color: var(--ref-color-electric-blue-100);
            font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); display: flex; align-items: center; justify-content: center;
        }
        .conv-msg-meta { display: flex; align-items: baseline; gap: 4px; flex: 1; min-width: 0; }
        .conv-author { font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); white-space: nowrap; }
        .conv-time { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); white-space: nowrap; }
        .conv-badge {
            font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); border-radius: var(--ref-radius-full); padding: 2px 7px; white-space: nowrap;
            &.internal { background: var(--ref-color-electric-blue-10); color: var(--ref-color-electric-blue-100); }
            &.external { background: var(--ref-color-orange-10); color: var(--ref-color-orange-100); }
        }
        .conv-reply-btn { opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .conv-msg-content { padding-left: 36px; }
        .conv-text { font-size: var(--ref-font-size-sm); color: var(--sys-text-color-default); line-height: var(--ref-font-line-height-sm); }
        .conv-reply-quote {
            margin-bottom: 6px; padding: 5px 8px;
            border-left: 3px solid var(--ref-color-electric-blue-40);
            background: var(--ref-color-grey-bg); border-radius: 0 var(--ref-radius-sm) var(--ref-radius-sm) 0;
            font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-80); line-height: var(--ref-font-line-height-xs);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .conv-attachments { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
        .conv-attachment {
            display: flex; align-items: center; gap: 6px;
            padding: 6px 8px; border-radius: var(--ref-radius-md);
            background: var(--ref-color-grey-bg); border: 1px solid var(--ref-color-grey-10);
        }
        .conv-att-name { font-size: var(--ref-font-size-xs); color: var(--sys-text-color-default); font-weight: var(--ref-font-weight-bold); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .conv-att-size { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); white-space: nowrap; }

        /* ── Empty state ── */
        .conv-empty {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 8px; padding: 24px;
        }
        .conv-empty-text { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); text-align: center; margin: 0; line-height: var(--ref-font-line-height-xs); }

        /* ── Composer ── */
        .conv-composer {
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white);
        }
        .conv-reply-strip {
            display: flex; align-items: center; justify-content: space-between;
            padding: 6px 10px 6px 14px;
            background: var(--ref-color-electric-blue-10);
            border-bottom: 1px solid var(--ref-color-electric-blue-20);
            font-size: var(--ref-font-size-xs); color: var(--sys-text-color-light);
            strong { color: var(--sys-text-color-default); }
        }
        .conv-reply-strip-content { display: flex; align-items: center; gap: 6px; }
        .conv-composer-tabs {
            display: block; border-bottom: 1px solid var(--sys-border-color-default);
            ::ng-deep > div > div:last-child { display: none !important; }
        }
        .conv-textarea {
            width: 100%; padding: 10px 14px; border: none; outline: none; resize: none;
            font-size: var(--ref-font-size-sm); font-family: var(--ref-font-family); background: var(--ref-color-white);
            color: var(--sys-text-color-default); box-sizing: border-box; line-height: var(--ref-font-line-height-sm);
            &::placeholder { color: var(--ref-color-grey-40); }
        }
        .conv-pending-attachments { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 8px; }
        .conv-pending-chip {
            display: flex; align-items: center; gap: 4px;
            padding: 3px 4px 3px 8px; border-radius: var(--ref-radius-md);
            background: var(--ref-color-grey-05); border: 1px solid var(--ref-color-grey-20);
            font-size: var(--ref-font-size-xs); color: var(--sys-text-color-default);
        }
        .conv-composer-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: 6px 10px; border-top: 1px solid var(--ref-color-grey-10);
        }
        .conv-composer-actions { display: flex; align-items: center; }
    `],
})
export class CreatePostComponent {
    close = output<void>();
    state = inject(ComposeStateService);

    rightPanel = signal<'history' | 'conversation' | null>(null);
    convTab = signal<'internal' | 'external'>('internal');
    replyingTo = signal<number | null>(null);
    pendingAttachments = signal<{name: string, size: string}[]>([]);

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
        { id: 1, initials: 'SW', author: 'Sarah W.', time: '23 min ago', type: 'Internal', text: 'Can you double-check the caption for Instagram? The hashtags might need updating.', replyToId: undefined as number | undefined, attachments: [] as {name: string, size: string}[] },
        { id: 2, initials: 'MB', author: 'Matt B.',  time: '18 min ago', type: 'Internal', text: 'Good point — I\'ll update the hashtags and add a couple more relevant ones.', replyToId: 1, attachments: [{ name: 'hashtag-ideas.txt', size: '2.1 KB' }] },
        { id: 3, initials: 'SW', author: 'Sarah W.', time: '10 min ago', type: 'External', text: 'Also the Facebook boost — are we targeting the right audience?', replyToId: undefined as number | undefined, attachments: [{ name: 'audience-brief.pdf', size: '140 KB' }] },
    ];

    getMessageById(id: number) { return this.conversationMessages.find(m => m.id === id); }
    removeAttachment(index: number): void { this.pendingAttachments.update(a => a.filter((_, i) => i !== index)); }
    onAttachFiles(event: Event): void {
        const files = (event.target as HTMLInputElement).files;
        if (!files) return;
        const newAtts = Array.from(files).map(f => ({ name: f.name, size: this.formatBytes(f.size) }));
        this.pendingAttachments.update(a => [...a, ...newAtts]);
        (event.target as HTMLInputElement).value = '';
    }
    private formatBytes(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
