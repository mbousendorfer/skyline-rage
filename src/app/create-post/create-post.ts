import { ButtonComponent } from '@agorapulse/ui-components/button';
import { CloseButtonComponent } from '@agorapulse/ui-components/close-button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { SegmentedControlComponent } from '@agorapulse/ui-components/segmented-control';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { TagComponent } from '@agorapulse/ui-components/tag';
import { ActionDropdownComponent, ActionDropdownTriggerDirective, ActionDropdownItem } from '@agorapulse/ui-components/action-dropdown';
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
    imports: [ButtonComponent, CloseButtonComponent, IconButtonComponent, SegmentedControlComponent, AvatarComponent, TagComponent, ActionDropdownComponent, ActionDropdownTriggerDirective, TooltipDirective, SymbolComponent, ProfilesPanelComponent, ComposePanelComponent, PreviewPanelComponent],
    template: `
        <div class="modal-container">
            <div class="modal-header">
                <h2 class="modal-title">Create post</h2>
                <div class="header-actions">
                    <ap-icon-button
                        symbolId="history"
                        ariaLabel="Post history"
                        [type]="rightPanel() === 'history' ? 'stroked' : 'flat'"
                        [color]="rightPanel() === 'history' ? 'blue' : 'none'"
                        [apTooltip]="'Post modification history'"
                        apTooltipPosition="bottom"
                        [apTooltipShowDelay]="400"
                        (onClick)="togglePanel('history')">
                    </ap-icon-button>
                    <ap-icon-button
                        symbolId="single-chat-bubble"
                        ariaLabel="Post conversation"
                        [type]="rightPanel() === 'conversation' ? 'stroked' : 'flat'"
                        [color]="rightPanel() === 'conversation' ? 'blue' : 'none'"
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
                                        <ap-avatar [username]="entry.author" [size]="24"></ap-avatar>
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
                                                <ap-avatar [username]="msg.author" [size]="24"></ap-avatar>
                                                <div class="conv-msg-meta">
                                                    <span class="conv-author">{{ msg.author }}</span>
                                                    <span class="conv-time">{{ msg.time }}</span>
                                                </div>
                                                <ap-tag [color]="msg.type === 'Internal' ? 'blue' : 'tagOrange'">{{ msg.type }}</ap-tag>
                                                <ap-icon-button class="conv-reply-btn" type="flat" symbolId="reply" ariaLabel="Reply" [apTooltip]="'Reply to this message'" apTooltipPosition="left" [apTooltipShowDelay]="400" (onClick)="replyingTo.set(msg.id)"></ap-icon-button>
                                            </div>
                                            <div class="conv-msg-content">
                                                @if (msg.replyToId) {
                                                    <div class="conv-reply-quote ap-truncate">{{ getMessageById(msg.replyToId)?.text }}</div>
                                                }
                                                <div class="conv-text">{{ msg.text }}</div>
                                                @if (msg.attachments.length) {
                                                    <div class="conv-attachments">
                                                        @for (att of msg.attachments; track att.name) {
                                                            <div class="conv-attachment">
                                                                <ap-symbol symbolId="paper-clip" size="xs" color="basic-grey"></ap-symbol>
                                                                <span class="conv-att-name ap-truncate">{{ att.name }}</span>
                                                                <span class="conv-att-size">{{ att.size }}</span>
                                                                <ap-icon-button type="flat" symbolId="download" ariaLabel="Download"></ap-icon-button>
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
                                    <ap-button [config]="{style:'ghost',color:'blue'}">Add a comment</ap-button>
                                </div>
                            }
                            <div class="conv-composer">
                                @if (replyingTo()) {
                                    <div class="conv-reply-strip">
                                        <div class="conv-reply-strip-content">
                                            <ap-symbol symbolId="reply" size="xs" color="basic-grey"></ap-symbol>
                                            <span>Replying to <strong>{{ getMessageById(replyingTo()!)?.author }}</strong></span>
                                        </div>
                                        <ap-icon-button type="flat" symbolId="close" ariaLabel="Cancel reply" (onClick)="replyingTo.set(null)"></ap-icon-button>
                                    </div>
                                }
                                <ap-segmented-control class="conv-composer-tabs" [fullWidth]="true"
                                    [options]="[{ value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }]"
                                    [value]="convTab()"
                                    (valueChange)="convTab.set($event === 'external' ? 'external' : 'internal')">
                                </ap-segmented-control>
                                <div class="ap-textarea-field conv-composer-field">
                                    <textarea placeholder="Write a comment..." rows="3"></textarea>
                                </div>
                                @if (pendingAttachments().length) {
                                    <div class="conv-pending-attachments">
                                        @for (att of pendingAttachments(); track att.name; let i = $index) {
                                            <ap-tag color="grey" [clearable]="true" (clear)="removeAttachment(i)">
                                                <ap-symbol symbolId="paper-clip" size="xs" color="basic-grey"></ap-symbol>
                                                {{ att.name }}
                                            </ap-tag>
                                        }
                                    </div>
                                }
                                <div class="conv-composer-footer">
                                    <div class="conv-composer-actions">
                                        <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat"></ap-icon-button>
                                        <ap-icon-button symbolId="paper-clip" ariaLabel="Attach file" type="flat" (onClick)="attachFileInput.click()"></ap-icon-button>
                                        <input #attachFileInput type="file" multiple style="display:none" (change)="onAttachFiles($event)">
                                    </div>
                                    <ap-button [config]="{ style: 'primary', color: 'blue' }">
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
                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="calendar" symbolPosition="left">Date &amp; Time</ap-button>
                        <ap-button [config]="{ style: 'primary', color: 'orange' }" [apActionDropdownTrigger]="scheduleMenu" symbolId="chevron-down" symbolPosition="right">Schedule</ap-button>
                        <ap-action-dropdown #scheduleMenu [items]="scheduleMenuItems"></ap-action-dropdown>
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
            padding: var(--ref-spacing-xxs) var(--ref-spacing-sm);
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white);
        }
        .modal-title { font-size: var(--sys-text-style-h2-size); font-weight: var(--sys-text-style-h2-weight); line-height: var(--sys-text-style-h2-line-height); color: var(--sys-text-color-default); margin: 0; }
        .header-actions { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); }
        /* Hand-built on purpose: the DS .ap-divider helper is a HORIZONTAL rule
           (height: 1px) and it paints with --sys-color-border-color-default, a token
           that does not exist in the theme (the real one is --sys-border-color-default),
           so it renders invisible. Two bugs to report to the DS team. */
        .divider { width: 1px; height: var(--ref-spacing-sm); background: var(--sys-border-color-default); margin: 0 var(--ref-spacing-xxxs); }

        .modal-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .modal-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxs) var(--ref-spacing-sm);
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white); gap: var(--ref-spacing-xs);
        }
        .footer-left { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); }
        .footer-right { display: flex; align-items: center; gap: var(--ref-spacing-xxs); }


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
            padding: var(--ref-spacing-xs); border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .right-panel-title { font-size: var(--sys-text-style-h3-size); font-weight: var(--sys-text-style-h3-weight); line-height: var(--sys-text-style-h3-line-height); color: var(--sys-text-color-default); }
        .right-panel-body {
            flex: 1; overflow-y: auto; padding: var(--ref-spacing-xs);
            display: flex; flex-direction: column; gap: var(--ref-spacing-sm);
        }

        /* History entries */
        .history-entry { display: flex; gap: var(--ref-spacing-xxs); align-items: flex-start; }
        .history-content { flex: 1; }
        .history-action { font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight); color: var(--sys-text-color-default); line-height: var(--sys-text-style-caption-bold-line-height); }
        .history-meta { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); }
        .history-diff {
            margin-top: var(--ref-spacing-xxxs); padding: var(--ref-spacing-xxxs) var(--ref-spacing-xxs); border-radius: var(--sys-border-radius-sm);
            background: var(--ref-color-grey-bg); border: 1px solid var(--sys-border-color-default);
            font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-default); line-height: var(--sys-text-style-caption-line-height);
        }

        /* ── Conversation messages ── */
        .conv-body { gap: 0; padding: 0; }
        .conv-msg {
            padding: var(--ref-spacing-xs);
            border-bottom: 1px solid var(--ref-color-grey-05);
            &:last-child { border-bottom: none; }
            &:hover .conv-reply-btn { opacity: 1; }
        }
        .conv-msg-row { display: flex; align-items: center; gap: var(--ref-spacing-xxs); margin-bottom: var(--ref-spacing-xxxs); }
        .conv-msg-meta { display: flex; align-items: baseline; gap: var(--ref-spacing-xxxs); flex: 1; min-width: 0; }
        .conv-author { font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight); color: var(--sys-text-color-default); white-space: nowrap; }
        .conv-time { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); white-space: nowrap; }
        .conv-reply-btn { opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .conv-msg-content { padding-left: var(--ref-spacing-lg); }
        .conv-text { font-size: var(--sys-text-style-body-size); color: var(--sys-text-color-default); line-height: var(--sys-text-style-body-line-height); }
        .conv-reply-quote {
            margin-bottom: 6px; padding: var(--ref-spacing-xxxs) var(--ref-spacing-xxs);
            border-left: 2px solid var(--ref-color-electric-blue-40);
            background: var(--ref-color-grey-bg); border-radius: 0 var(--sys-border-radius-sm) var(--sys-border-radius-sm) 0;
            font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); line-height: var(--sys-text-style-caption-line-height);
        }
        .conv-attachments { display: flex; flex-direction: column; gap: var(--ref-spacing-xxxs); margin-top: var(--ref-spacing-xxs); }
        .conv-attachment {
            display: flex; align-items: center; gap: var(--ref-spacing-xxxs);
            padding: var(--ref-spacing-xxxs) var(--ref-spacing-xxs); border-radius: var(--sys-border-radius-md);
            background: var(--ref-color-grey-bg); border: 1px solid var(--sys-border-color-default);
        }
        .conv-att-name { font-size: var(--sys-text-style-caption-bold-size); color: var(--sys-text-color-default); font-weight: var(--sys-text-style-caption-bold-weight); flex: 1; min-width: 0; }
        .conv-att-size { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); white-space: nowrap; }

        /* ── Empty state ── */
        .conv-empty {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: var(--ref-spacing-xxs); padding: var(--ref-spacing-md);
        }
        .conv-empty-text { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); text-align: center; margin: 0; line-height: var(--sys-text-style-caption-line-height); }

        /* ── Composer ── */
        .conv-composer {
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0; background: var(--ref-color-white);
        }
        .conv-reply-strip {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxxs) var(--ref-spacing-xs);
            background: var(--ref-color-electric-blue-10);
            border-bottom: 1px solid var(--ref-color-electric-blue-20);
            font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light);
            strong { color: var(--sys-text-color-default); }
        }
        .conv-reply-strip-content { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); }
        .conv-composer-tabs { display: block; padding: var(--ref-spacing-xxs) var(--ref-spacing-xxs) 0; }
        /* DS textarea (css-ui .ap-textarea-field); the min-width is relaxed so it can
           fill the 300px side panel. */
        .conv-composer-field {
            padding: var(--ref-spacing-xxs);
            > textarea { min-width: 0; }
        }
        .conv-pending-attachments { display: flex; flex-wrap: wrap; gap: var(--ref-spacing-xxxs); padding: 0 var(--ref-spacing-xs) var(--ref-spacing-xxs); }
        .conv-composer-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxxs) var(--ref-spacing-xxs); border-top: 1px solid var(--sys-border-color-default);
        }
        .conv-composer-actions { display: flex; align-items: center; }
    `],
})
export class CreatePostComponent {
    close = output<void>();
    state = inject(ComposeStateService);

    readonly scheduleMenuItems: ActionDropdownItem[] = [
        { name: 'now', label: 'Schedule now', startSymbolId: 'clock' },
        { name: 'optimal', label: 'Schedule at optimal time', startSymbolId: 'sparkles' },
        { name: 'queue', label: 'Add to queue', startSymbolId: 'calendar' },
    ];

    rightPanel = signal<'history' | 'conversation' | null>(null);
    convTab = signal<'internal' | 'external'>('internal');
    replyingTo = signal<number | null>(null);
    pendingAttachments = signal<{name: string, size: string}[]>([]);

    togglePanel(panel: 'history' | 'conversation'): void {
        this.rightPanel.update(current => current === panel ? null : panel);
    }

    readonly historyEntries = [
        { id: 1, author: 'Matt B.', time: '2 min ago', action: 'Post text modified', diff: '"J\'aime beaucoup cette salle de bain"' },
        { id: 2, author: 'Matt B.', time: '8 min ago', action: 'Media added', diff: null },
        { id: 3, author: 'Matt B.', time: '12 min ago', action: 'Facebook customization added', diff: null },
        { id: 4, author: 'Matt B.', time: '15 min ago', action: 'Draft saved', diff: null },
        { id: 5, author: 'Sarah W.', time: '1 hr ago', action: 'Post created', diff: null },
    ];

    readonly conversationMessages = [
        { id: 1, author: 'Sarah W.', time: '23 min ago', type: 'Internal', text: 'Can you double-check the caption for Instagram? The hashtags might need updating.', replyToId: undefined as number | undefined, attachments: [] as {name: string, size: string}[] },
        { id: 2, author: 'Matt B.',  time: '18 min ago', type: 'Internal', text: 'Good point — I\'ll update the hashtags and add a couple more relevant ones.', replyToId: 1, attachments: [{ name: 'hashtag-ideas.txt', size: '2.1 KB' }] },
        { id: 3, author: 'Sarah W.', time: '10 min ago', type: 'External', text: 'Also the Facebook boost — are we targeting the right audience?', replyToId: undefined as number | undefined, attachments: [{ name: 'audience-brief.pdf', size: '140 KB' }] },
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
