import { ButtonComponent } from '@agorapulse/ui-components/button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { SlideToggleComponent } from '@agorapulse/ui-components/slide-toggle';
import { TabsComponent, TabComponent } from '@agorapulse/ui-components/tabs';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import {
    ChangeDetectionStrategy, Component, computed, effect,
    ElementRef, inject, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComposeStateService, Customization } from '../compose-state';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-compose-panel',
    imports: [ButtonComponent, IconButtonComponent, SlideToggleComponent, TabsComponent, TabComponent, AvatarComponent, SymbolComponent, FormsModule, DecimalPipe],
    template: `
        <div class="compose-panel">
            <div class="panel-header">Compose your post</div>
            <div class="compose-content" #composeContent>

                <!-- ── Base post ─────────────────────────────────────────── -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <ap-symbol symbolId="star" size="xs" color="blood-orange"></ap-symbol>
                            <span>Base post</span>
                        </div>
                        <span class="section-hint">Shared across all unless customized</span>
                    </div>
                    <div class="text-editor" [class.focused]="baseTextFocused()">
                        <textarea
                            class="post-textarea"
                            [value]="state.baseText()"
                            (input)="onBaseTextInput($event)"
                            (focus)="baseTextFocused.set(true)"
                            (blur)="baseTextFocused.set(false)"
                            rows="4"
                            placeholder="What do you want to share?">
                        </textarea>
                        <div class="editor-toolbar">
                            <div class="toolbar-icons">
                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat"></ap-icon-button>
                                <ap-icon-button symbolId="pin" ariaLabel="Location" type="flat"></ap-icon-button>
                                <ap-icon-button symbolId="hashtag" ariaLabel="Hashtag" type="flat"></ap-icon-button>
                                <ap-icon-button symbolId="variable" ariaLabel="Variable" type="flat"></ap-icon-button>
                            </div>
                            <ap-button class="writing-assistant-btn" [config]="{ style: 'stroked', color: 'blue' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                        </div>
                        <div class="editor-footer">
                            <div class="char-counts">
                                @if (state.facebookProfiles().length > 0) {
                                    <span class="char-count" [class.warning]="fbWarning()" [class.danger]="fbDanger()">
                                        <ap-symbol symbolId="facebook" size="xs" [color]="fbDanger() ? 'red' : fbWarning() ? 'orange' : 'facebook'"></ap-symbol>
                                        {{ state.fbCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.linkedinProfiles().length > 0) {
                                    <span class="char-count" [class.danger]="state.liCharsRemaining() < 0">
                                        <ap-symbol symbolId="linkedin" size="xs" [color]="state.liCharsRemaining() < 0 ? 'red' : 'linkedin'"></ap-symbol>
                                        {{ state.liCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.instagramProfiles().length > 0) {
                                    <span class="char-count" [class.danger]="state.igCharsRemaining() < 0">
                                        <ap-symbol symbolId="instagram" size="xs" [color]="state.igCharsRemaining() < 0 ? 'red' : 'instagram'"></ap-symbol>
                                        {{ state.igCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.twitterProfiles().length > 0) {
                                    <span class="char-count" [class.danger]="state.twitterCharsRemaining() < 0">
                                        <ap-symbol symbolId="x-twitter" size="xs" [color]="state.twitterCharsRemaining() < 0 ? 'red' : 'twitter'"></ap-symbol>
                                        {{ state.twitterCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.selectedProfiles().length === 0) {
                                    <span class="char-count grey">
                                        <ap-symbol symbolId="facebook" size="xs" color="basic-grey"></ap-symbol>
                                        {{ state.fbCharsRemaining() | number }}
                                    </span>
                                }
                            </div>
                            <div class="draft-row">
                                <span class="draft-label">This is a draft</span>
                                <ap-slide-toggle [checked]="state.isDraft()" (checkedChange)="state.isDraft.set($event)"></ap-slide-toggle>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Media ─────────────────────────────────────────────── -->
                <div class="section">
                    <div class="collapsible-header" (click)="mediaExpanded.set(!mediaExpanded())">
                        <span class="collapsible-title">Media</span>
                        <ap-symbol [symbolId]="mediaExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                    </div>
                    @if (mediaExpanded()) {
                        <div class="media-grid">
                            <button class="add-media-btn" (click)="addMedia()">
                                <ap-symbol symbolId="plus" size="sm" color="basic-grey"></ap-symbol>
                            </button>
                            @for (item of state.mediaItems(); track item.id) {
                                <div class="media-thumb">
                                    <img [src]="item.url" alt="Media" />
                                    <div class="media-overlay">
                                        <button><ap-symbol symbolId="more" size="xs" color="black"></ap-symbol></button>
                                        <button (click)="removeMedia(item.id)"><ap-symbol symbolId="trash" size="xs" color="red"></ap-symbol></button>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </div>

                <!-- ── Customizations ─────────────────────────────────────── -->
                <div class="section" #customizationsSection>
                    <div class="collapsible-header" (click)="customizationsExpanded.set(!customizationsExpanded())">
                        <span class="collapsible-title">
                            Customizations
                            @if (state.activeCustomizations().length > 0) {
                                <span class="section-count">{{ state.activeCustomizations().length }} post(s)</span>
                            }
                        </span>
                        <ap-symbol [symbolId]="customizationsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                    </div>

                    @if (customizationsExpanded()) {
                        @if (state.activeCustomizations().length === 0) {
                            <p class="empty-hint">
                                Click <strong>Customize</strong> on any preview card to add a per‑profile override.
                            </p>
                        }

                        @for (custom of state.activeCustomizations(); track custom.profileId) {
                            <div
                                class="custom-card"
                                [attr.data-custom-id]="custom.profileId"
                                [class.flash-highlight]="flashingId() === custom.profileId"
                                [class.has-error]="customHasError(custom.profileId, custom.text)">
                                <!-- card header -->
                                <div class="custom-card-header">
                                    <div class="profile-row">
                                        <ap-avatar
                                            [username]="profileName(custom.profileId)"
                                            [network]="profileNetwork(custom.profileId)"
                                            [size]="24">
                                        </ap-avatar>
                                        <span class="profile-label">{{ profileName(custom.profileId) }}</span>
                                        @if (customHasError(custom.profileId, custom.text)) {
                                            <ap-symbol symbolId="error" size="xs" color="red" title="This profile has a validation error"></ap-symbol>
                                        }
                                    </div>
                                    <div class="row-gap">
                                        <ap-icon-button
                                            symbolId="refresh"
                                            ariaLabel="Reset to base text"
                                            type="flat"
                                            size="small"
                                            (onClick)="state.resetCustomization(custom.profileId)">
                                        </ap-icon-button>
                                        <ap-icon-button
                                            symbolId="close"
                                            ariaLabel="Remove customization"
                                            type="flat"
                                            size="small"
                                            (onClick)="state.removeCustomization(custom.profileId)">
                                        </ap-icon-button>
                                    </div>
                                </div>
                                <p class="override-hint">overrides base content and options</p>

                                <!-- text editor -->
                                <div class="text-editor inner" [class.focused]="focusedEditorId() === custom.profileId">
                                    <textarea
                                        class="post-textarea"
                                        [value]="custom.text"
                                        (input)="onCustomTextInput($event, custom.profileId)"
                                        (focus)="focusedEditorId.set(custom.profileId)"
                                        (blur)="focusedEditorId.set(null)"
                                        rows="3"
                                        [placeholder]="'Customize post for ' + profileName(custom.profileId) + '…'">
                                    </textarea>
                                    <div class="editor-toolbar">
                                        <div class="toolbar-icons">
                                            <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat"></ap-icon-button>
                                            <ap-icon-button symbolId="pin" ariaLabel="Location" type="flat"></ap-icon-button>
                                            <ap-icon-button symbolId="hashtag" ariaLabel="Hashtag" type="flat"></ap-icon-button>
                                            <ap-icon-button symbolId="variable" ariaLabel="Variable" type="flat"></ap-icon-button>
                                        </div>
                                        <ap-button class="writing-assistant-btn" [config]="{ style: 'stroked', color: 'blue' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                    </div>
                                </div>

                                <!-- char count -->
                                <div class="char-counts inner">
                                    <span class="char-count" [class.danger]="custom.text.length > 10000">
                                        <ap-symbol [symbolId]="profileNetwork(custom.profileId)" size="xs" [color]="profileNetwork(custom.profileId)"></ap-symbol>
                                        {{ (10000 - custom.text.length) | number }}
                                    </span>
                                </div>

                                <!-- first comment toggle -->
                                <div class="option-row toggle-row">
                                    <div class="option-info">
                                        <span class="option-label">First comment</span>
                                        <span class="option-hint">Publish a first comment with your post</span>
                                    </div>
                                    <ap-slide-toggle
                                        [checked]="custom.firstComment"
                                        (checkedChange)="state.updateCustomizationFirstComment(custom.profileId, $event)">
                                    </ap-slide-toggle>
                                </div>
                                @if (custom.firstComment) {
                                    <div class="first-comment-editor">
                                        <textarea
                                            class="post-textarea small"
                                            [value]="custom.firstCommentText"
                                            (input)="onFirstCommentInput($event, custom.profileId)"
                                            placeholder="Write your first comment…"
                                            rows="2">
                                        </textarea>
                                    </div>
                                }
                            </div>
                        }
                    }
                </div>

                <!-- ── Network options ────────────────────────────────────── -->
                <div class="section last">
                    <div class="section-header">
                        <span class="collapsible-title">Network options</span>
                    </div>
                    <p class="network-hint">Defaults applied to all profiles per network. Customize a profile to override individually.</p>

                    @if (state.facebookProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" (click)="fbOptionsExpanded.set(!fbOptionsExpanded())">
                                <div class="row-gap">
                                    <ap-symbol symbolId="facebook" size="sm" color="facebook"></ap-symbol>
                                    <span class="network-label">Facebook options</span>
                                </div>
                                <ap-symbol [symbolId]="fbOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (fbOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="inner-pad"><ap-tabs><ap-tab label="Post"></ap-tab><ap-tab label="Reel"></ap-tab><ap-tab label="Story"></ap-tab></ap-tabs></div>
                                    <div class="field-group">
                                        <label class="field-label">Video title</label>
                                        <textarea class="field-textarea" [value]="state.fbVideoTitle()" (input)="state.fbVideoTitle.set(asTextarea($event))" placeholder="Improve your video's distribution with a title." rows="2"></textarea>
                                    </div>
                                    <div class="char-counts inner">
                                        <span class="char-count"><ap-symbol symbolId="facebook" size="xs" color="facebook"></ap-symbol> {{ state.fbCharsRemaining() | number }}</span>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Boost this post</span><span class="option-hint">Text about what is post boosting</span></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'blue' }" size="small" symbolId="ad" symbolPosition="left">Boost Post</ap-button>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                        <ap-slide-toggle [checked]="state.fbFirstComment()" (checkedChange)="state.fbFirstComment.set($event)"></ap-slide-toggle>
                                    </div>
                                    @if (state.fbFirstComment()) {
                                        <div class="first-comment-editor">
                                            <textarea class="post-textarea small" [value]="state.fbFirstCommentText()" (input)="state.fbFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    @if (state.instagramProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" (click)="igOptionsExpanded.set(!igOptionsExpanded())">
                                <div class="row-gap">
                                    <ap-symbol symbolId="instagram" size="sm" color="instagram"></ap-symbol>
                                    <span class="network-label">Instagram options</span>
                                </div>
                                <ap-symbol [symbolId]="igOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (igOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="inner-pad"><ap-tabs><ap-tab label="Post"></ap-tab><ap-tab label="Story"></ap-tab></ap-tabs></div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                        <ap-slide-toggle [checked]="state.igMobileNotif()" (checkedChange)="state.igMobileNotif.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                        <ap-slide-toggle [checked]="state.igFirstComment()" (checkedChange)="state.igFirstComment.set($event)"></ap-slide-toggle>
                                    </div>
                                    @if (state.igFirstComment()) {
                                        <div class="first-comment-editor">
                                            <textarea class="post-textarea small" [value]="state.igFirstCommentText()" (input)="state.igFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                        </div>
                                    }
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">PulseLink in Bio</span><span class="option-hint">Add a link to your content on your PulseLink</span></div>
                                        <ap-slide-toggle [checked]="state.igPulseLink()" (checkedChange)="state.igPulseLink.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row action-row">
                                        <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag users</span><span class="option-hint">No users</span></div></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left">Tag users</ap-button>
                                    </div>
                                    <div class="option-row action-row">
                                        <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Invite collaborator(s)</span><span class="option-hint">No collaborator(s)</span></div></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left">Invite collaborator(s)</ap-button>
                                    </div>
                                    <div class="option-row action-row">
                                        <div class="option-info-row"><ap-symbol symbolId="product-tag" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag products</span><span class="option-hint">No products</span></div></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="product-tag" symbolPosition="left">Tag products</ap-button>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    @if (state.linkedinProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" (click)="liOptionsExpanded.set(!liOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="linkedin" size="sm" color="linkedin"></ap-symbol><span class="network-label">LinkedIn options</span></div>
                                <ap-symbol [symbolId]="liOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (liOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="inner-pad"><ap-tabs><ap-tab label="Post"></ap-tab><ap-tab label="Article"></ap-tab></ap-tabs></div>
                                    <div class="char-counts inner"><span class="char-count"><ap-symbol symbolId="linkedin" size="xs" color="linkedin"></ap-symbol> {{ (3000 - state.baseText().length) | number }}</span></div>
                                </div>
                            }
                        </div>
                    }

                    @if (state.twitterProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" (click)="xOptionsExpanded.set(!xOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="x-twitter" size="sm" color="twitter"></ap-symbol><span class="network-label">X (Twitter) options</span></div>
                                <ap-symbol [symbolId]="xOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (xOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="char-counts inner">
                                        <span class="char-count" [class.danger]="state.baseText().length > 280">
                                            <ap-symbol symbolId="x-twitter" size="xs" color="twitter"></ap-symbol>
                                            {{ 280 - state.baseText().length }}
                                        </span>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    @if (state.selectedProfiles().length === 0) {
                        <p class="empty-hint">Select profiles to see network‑specific options.</p>
                    }
                </div>

            </div>
        </div>
    `,
    styles: [`
        :host { display: flex; flex: 1; min-width: 0; min-height: 0; max-width: 50%; }
        .compose-panel {
            display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0;
            background: #F9F9FA;
            border-right: 1px solid var(--sys-border-color-default);
            overflow: hidden;
        }
        .panel-header {
            padding: 10px 16px; font-size: 12px; font-weight: 600;
            color: var(--sys-text-color-default);
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .compose-content { flex: 1; min-height: 0; overflow-y: auto; padding: 0 16px 20px; background: #F9F9FA; }
        .section { padding: 12px 0; border-bottom: 1px solid var(--ref-color-grey-10); &.last { border-bottom: none; } }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
        .section-hint { font-size: 11px; color: var(--ref-color-grey-60); }

        .text-editor {
            border: 1px solid var(--sys-border-color-default); border-radius: 8px; overflow: hidden;
            background: var(--ref-color-white); transition: border-color 0.15s, box-shadow 0.15s;
            &.inner { border-radius: 6px; margin: 8px 0; }
            &.focused { border-color: var(--ref-color-electric-blue-60); box-shadow: 0 0 0 3px var(--ref-color-electric-blue-05); }
        }
        .post-textarea {
            width: 100%; padding: 10px 12px; border: none; outline: none; resize: none;
            font-size: 13px; color: var(--sys-text-color-default);
            font-family: 'Averta', sans-serif; background: transparent; line-height: 1.5;
            box-sizing: border-box;
            &.small { padding: 8px 12px; font-size: 12px; }
            &::placeholder { color: var(--ref-color-grey-60); }
        }
        .editor-toolbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 8px; border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-white);
        }
        .toolbar-icons { display: flex; }
        .writing-assistant-btn {
            ::ng-deep button {
                background: linear-gradient(white, white) padding-box,
                            linear-gradient(135deg, #6c63ff 0%, #f7619a 100%) border-box !important;
                border: 1.5px solid transparent !important;
                color: #6c63ff !important;
                font-weight: 600 !important;
            }
            ::ng-deep ap-symbol svg { color: #6c63ff !important; }
        }
        .editor-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: 6px 12px; border-top: 1px solid var(--ref-color-grey-10);
        }
        .char-counts { display: flex; gap: 12px; &.inner { padding: 4px 12px 8px; } }
        .char-count {
            display: flex; align-items: center; gap: 4px; font-size: 12px;
            color: var(--ref-color-electric-blue-100);
            &.grey { color: var(--ref-color-grey-60); }
            &.warning { color: var(--ref-color-orange-100); }
            &.danger { color: var(--ref-color-red-100); font-weight: 600; }
        }
        .draft-row { display: flex; align-items: center; gap: 8px; }
        .draft-label { font-size: 12px; color: var(--sys-text-color-light); }

        .collapsible-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 0 8px; cursor: pointer; user-select: none;
            &.padded { padding: 10px 12px; }
        }
        .collapsible-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--sys-text-color-default); }
        .section-count { font-size: 11px; font-weight: 400; color: var(--ref-color-grey-60); }

        .media-grid { display: flex; gap: 8px; flex-wrap: wrap; &.inner { padding: 0 12px 8px; } }
        .add-media-btn {
            width: 68px; height: 68px; border: 2px dashed var(--ref-color-grey-40);
            border-radius: 8px; background: transparent; cursor: pointer;
            display: flex; align-items: center; justify-content: center; transition: all 0.15s;
            &:hover { background: var(--ref-color-grey-05); border-color: var(--ref-color-electric-blue-60); }
        }
        .media-thumb {
            position: relative; width: 68px; height: 68px; border-radius: 8px; overflow: hidden;
            img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .media-overlay {
                position: absolute; top: 2px; right: 2px; display: flex; gap: 2px;
                opacity: 0; transition: opacity 0.15s;
                button { width: 22px; height: 22px; border: none; border-radius: 4px; background: rgba(255,255,255,0.92); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
            }
            &:hover .media-overlay { opacity: 1; }
        }

        /* Customization cards */
        .custom-card {
            border: 1px solid var(--sys-border-color-default); border-radius: 8px;
            overflow: hidden; margin-bottom: 10px; background: var(--ref-color-white);
            transition: box-shadow 0.2s, border-color 0.2s;
            &.has-error { border-color: var(--ref-color-red-40, #fca5a5); }
        }
        @keyframes flashHighlight {
            0%   { box-shadow: 0 0 0 3px var(--ref-color-electric-blue-40); border-color: var(--ref-color-electric-blue-60); }
            70%  { box-shadow: 0 0 0 3px var(--ref-color-electric-blue-20); border-color: var(--ref-color-electric-blue-40); }
            100% { box-shadow: none; border-color: var(--sys-border-color-default); }
        }
        .flash-highlight { animation: flashHighlight 1.4s ease-out forwards; }

        .custom-card-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 12px; background: var(--ref-color-grey-05);
            border-bottom: 1px solid var(--sys-border-color-default);
        }
        .profile-row { display: flex; align-items: center; gap: 8px; }
        .profile-label { font-size: 13px; font-weight: 600; color: var(--sys-text-color-default); }
        .row-gap { display: flex; align-items: center; gap: 6px; }
        .override-hint { font-size: 11px; color: var(--ref-color-grey-60); padding: 4px 12px 0; margin: 0; }
        .inner-pad { padding: 8px 12px 4px; }

        .option-row {
            display: flex; align-items: flex-start; justify-content: space-between;
            padding: 10px 12px; border-top: 1px solid var(--ref-color-grey-10); gap: 12px;
            &.toggle-row { align-items: center; }
            &.action-row { align-items: center; }
        }
        .option-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .option-info-row { display: flex; align-items: center; gap: 8px; flex: 1; }
        .option-label { font-size: 12px; font-weight: 500; color: var(--sys-text-color-default); }
        .option-hint { font-size: 11px; color: var(--ref-color-grey-60); line-height: 1.4; }

        .first-comment-editor {
            padding: 8px 12px 12px;
            border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-grey-02, #fafafa);
        }

        .network-hint { font-size: 11px; color: var(--ref-color-grey-60); margin: 0 0 8px; line-height: 1.5; }
        .network-card { border: 1px solid var(--sys-border-color-default); border-radius: 8px; margin-top: 8px; overflow: hidden; background: var(--ref-color-white); }
        .network-card-content { padding: 0 0 8px; }
        .network-label { font-size: 13px; font-weight: 600; color: var(--sys-text-color-default); }
        .field-group {
            padding: 8px 12px 4px;
            .field-label { display: block; font-size: 12px; font-weight: 500; color: var(--sys-text-color-light); margin-bottom: 4px; }
            .field-textarea {
                width: 100%; padding: 8px 10px; border: 1px solid var(--sys-border-color-default);
                border-radius: 6px; font-size: 12px; color: var(--sys-text-color-default);
                font-family: 'Averta', sans-serif; resize: none; outline: none;
                background: var(--ref-color-white); box-sizing: border-box;
                &::placeholder { color: var(--ref-color-grey-60); }
                &:focus { border-color: var(--ref-color-electric-blue-60); }
            }
        }
        .empty-hint { font-size: 12px; color: var(--ref-color-grey-60); margin: 4px 0 0; }
    `],
})
export class ComposePanelComponent {
    state = inject(ComposeStateService);
    private el = inject(ElementRef);

    baseTextFocused = signal(false);
    focusedEditorId = signal<string | null>(null);
    flashingId = signal<string | null>(null);
    mediaExpanded = signal(true);
    customizationsExpanded = signal(true);
    fbOptionsExpanded = signal(true);
    igOptionsExpanded = signal(true);
    liOptionsExpanded = signal(true);
    xOptionsExpanded = signal(true);

    fbWarning = computed(() => { const r = this.state.fbCharsRemaining(); return r < 1000 && r >= 0; });
    fbDanger = computed(() => this.state.fbCharsRemaining() < 0);

    constructor() {
        // React when the preview panel requests focus on a customization card
        effect(() => {
            const targetId = this.state.focusedCustomizationId();
            if (!targetId) return;

            // Expand the section first
            this.customizationsExpanded.set(true);

            // Wait for DOM to render the card, then scroll + flash
            setTimeout(() => {
                const card = this.el.nativeElement.querySelector(`[data-custom-id="${targetId}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    this.flashingId.set(targetId);
                    setTimeout(() => this.flashingId.set(null), 1500);
                }
                // Clear the focus request so it can fire again next time
                this.state.focusedCustomizationId.set(null);
            }, 60);
        });
    }

    profileName(profileId: string): string {
        return this.state.allProfiles().find(p => p.id === profileId)?.name ?? profileId;
    }

    profileNetwork(profileId: string): string {
        return this.state.allProfiles().find(p => p.id === profileId)?.network ?? 'facebook';
    }

    /** Returns true if the custom text for this profile exceeds its network's character limit. */
    customHasError(profileId: string, text: string): boolean {
        const network = this.profileNetwork(profileId);
        const limits: Record<string, number> = { facebook: 10000, linkedin: 3000, instagram: 2200, twitter: 280 };
        return text.length > (limits[network] ?? Infinity);
    }

    onBaseTextInput(event: Event): void {
        this.state.baseText.set((event.target as HTMLTextAreaElement).value);
    }

    onCustomTextInput(event: Event, profileId: string): void {
        this.state.updateCustomizationText(profileId, (event.target as HTMLTextAreaElement).value);
    }

    onFirstCommentInput(event: Event, profileId: string): void {
        this.state.updateCustomizationFirstCommentText(profileId, (event.target as HTMLTextAreaElement).value);
    }

    asTextarea(event: Event): string {
        return (event.target as HTMLTextAreaElement).value;
    }

    private readonly extraMedia = [
        { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&h=120&fit=crop', width: 5472, height: 3648, type: 'image' as const },
        { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&h=120&fit=crop', width: 3000, height: 2000, type: 'image' as const },
        { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=120&h=120&fit=crop', width: 4000, height: 2667, type: 'image' as const },
    ];

    addMedia(): void {
        const idx = this.state.mediaItems().length % this.extraMedia.length;
        const m = this.extraMedia[idx];
        this.state.addMediaItem({ id: Date.now(), ...m });
    }

    removeMedia(id: number): void {
        this.state.removeMediaItem(id);
    }
}
