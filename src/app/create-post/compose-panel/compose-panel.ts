import { ButtonComponent } from '@agorapulse/ui-components/button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { ToggleComponent } from '@agorapulse/ui-components/toggle';
import { TabsComponent, TabComponent } from '@agorapulse/ui-components/tabs';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import {
    ChangeDetectionStrategy, Component, computed, effect,
    ElementRef, HostListener, inject, signal, ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComposeStateService, Collaborator, Customization, MediaItem } from '../compose-state';

interface TaggedUser { id: string; x: number; y: number; username: string; }

interface CollabUser { handle: string; name: string; avatar: string; }

const COLLAB_MOCK_USERS: CollabUser[] = [
    { handle: '@sophie.martin',     name: 'Sophie Martin',  avatar: 'https://i.pravatar.cc/40?img=1' },
    { handle: '@lucas.photography', name: 'Lucas Bernard',  avatar: 'https://i.pravatar.cc/40?img=2' },
    { handle: '@marie.creates',     name: 'Marie Dupont',   avatar: 'https://i.pravatar.cc/40?img=3' },
    { handle: '@julien.traveler',   name: 'Julien Moreau',  avatar: 'https://i.pravatar.cc/40?img=4' },
    { handle: '@camille.studio',    name: 'Camille Leroy',  avatar: 'https://i.pravatar.cc/40?img=5' },
    { handle: '@theo.visuals',      name: 'Théo Petit',     avatar: 'https://i.pravatar.cc/40?img=6' },
];

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-compose-panel',
    imports: [ButtonComponent, IconButtonComponent, ToggleComponent, TabsComponent, TabComponent, AvatarComponent, TooltipDirective, SymbolComponent, FormsModule, DecimalPipe],
    template: `
        <div class="compose-panel" [class.is-draft]="state.isDraft()">
            <!-- Hidden file inputs for upload sources -->
            <input #fileInput type="file" accept="image/*,video/*" multiple style="display:none" (change)="onFilesSelected($event)">
            <input #replaceInput type="file" accept="image/*,video/*" style="display:none" (change)="onReplaceSelected($event)">

            <!-- ── Tab navigation ──────────────────────────────────────── -->
            <div class="compose-tabs">
                <ap-tabs class="compose-tab-nav"
                    [selectedIndex]="activeTab() === 'base' ? 0 : 1"
                    (tabChange)="activeTab.set($event.index === 0 ? 'base' : 'customized')">
                    <ap-tab label="Base post"></ap-tab>
                    <ap-tab label="Customized posts" [counter]="state.activeCustomizations().length"></ap-tab>
                </ap-tabs>
                <div class="draft-toggle-tab" [class.is-on]="state.isDraft()">
                    <span class="draft-toggle-label">Draft</span>
                    <ap-toggle name="isDraft" [checked]="state.isDraft()" (change)="state.isDraft.set($event)"></ap-toggle>
                </div>
            </div>

            <div class="compose-content" #composeContent>
            @if (activeTab() === 'base') {
                <div class="panel-header">Compose your post</div>

                <!-- ── Base post ─────────────────────────────────────────── -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <ap-symbol symbolId="star" size="xs" color="blood-orange"></ap-symbol>
                            <span>Base post</span>
                        </div>
                        <span class="section-hint">Shared across all unless customized</span>
                    </div>
                    <div class="text-editor" [class.focused]="baseTextFocused()" [class.expanded]="baseEditorExpanded()">
                        <textarea
                            class="post-textarea"
                            [value]="state.baseText()"
                            (input)="onBaseTextInput($event)"
                            (focus)="baseTextFocused.set(true)"
                            (blur)="baseTextFocused.set(false)"
                            placeholder="What do you want to share?">
                        </textarea>
                        <div class="editor-toolbar">
                            <div class="toolbar-icons">
                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat" [apTooltip]="'Add an emoji'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                <ap-icon-button symbolId="pin" ariaLabel="Location" type="flat" [apTooltip]="'Tag a location'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                <ap-icon-button symbolId="hashtag" ariaLabel="Hashtag" type="flat" [apTooltip]="'Add hashtags'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                <ap-icon-button symbolId="variable" ariaLabel="Variable" type="flat" [apTooltip]="'Insert a variable'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                            </div>
                            <div class="toolbar-right">
                                <ap-button [config]="{ style: 'mermaid' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                <ap-icon-button type="flat" [symbolId]="baseEditorExpanded() ? 'chevron-up' : 'chevron-down'" [ariaLabel]="baseEditorExpanded() ? 'Collapse editor' : 'Expand editor'" [apTooltip]="baseEditorExpanded() ? 'Collapse editor' : 'Expand editor'" apTooltipPosition="bottom" [apTooltipShowDelay]="400" (onClick)="baseEditorExpanded.set(!baseEditorExpanded())"></ap-icon-button>
                            </div>
                        </div>
                        <div class="editor-footer">
                            <div class="char-counts">
                                @if (state.facebookProfiles().length > 0) {
                                    <span class="char-count" [class.warning]="fbWarning()" [class.danger]="fbDanger()" [apTooltip]="'Facebook — ' + (state.fbCharsRemaining() | number) + ' chars remaining (limit 10,000)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="facebook" size="xs" [color]="fbDanger() ? 'red' : fbWarning() ? 'orange' : 'facebook'"></ap-symbol>
                                        {{ state.fbCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.linkedinProfiles().length > 0) {
                                    <span class="char-count" [class.danger]="state.liCharsRemaining() < 0" [apTooltip]="'LinkedIn — ' + (state.liCharsRemaining() | number) + ' chars remaining (limit 3,000)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="linkedin" size="xs" [color]="state.liCharsRemaining() < 0 ? 'red' : 'linkedin'"></ap-symbol>
                                        {{ state.liCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.instagramProfiles().length > 0) {
                                    <span class="char-count" [class.danger]="state.igCharsRemaining() < 0" [apTooltip]="'Instagram — ' + (state.igCharsRemaining() | number) + ' chars remaining (limit 2,200)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="instagram" size="xs" [color]="state.igCharsRemaining() < 0 ? 'red' : 'instagram'"></ap-symbol>
                                        {{ state.igCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.twitterProfiles().length > 0) {
                                    <span class="char-count" [class.danger]="state.twitterCharsRemaining() < 0" [apTooltip]="'X (Twitter) — ' + (state.twitterCharsRemaining() | number) + ' chars remaining (limit 280)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="x-official" size="xs" [color]="state.twitterCharsRemaining() < 0 ? 'red' : 'twitter'"></ap-symbol>
                                        {{ state.twitterCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.selectedProfiles().length === 0) {
                                    <span class="char-count grey" [apTooltip]="'Characters remaining'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="facebook" size="xs" color="basic-grey"></ap-symbol>
                                        {{ state.fbCharsRemaining() | number }}
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Media ─────────────────────────────────────────────── -->
                <div class="section">
                    <div class="collapsible-header" (click)="mediaExpanded.set(!mediaExpanded())">
                        <span class="collapsible-title">
                            Media
                            @if (!mediaExpanded() && state.mediaItems().length > 0) {
                                <span class="section-count">({{ state.mediaItems().length }})</span>
                            }
                        </span>
                        <ap-symbol [symbolId]="mediaExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                    </div>
                    @if (mediaExpanded()) {
                        <div class="media-drop-zone"
                             [class.drag-over]="isDraggingOver()"
                             (dragover)="onDragOver($event)"
                             (dragleave)="onDragLeave($event)"
                             (drop)="onDrop($event)">
                            @if (isDraggingOver()) {
                                <div class="drop-overlay">
                                    <ap-symbol symbolId="upload" size="md" color="basic-grey"></ap-symbol>
                                    <span>Drop files here</span>
                                </div>
                            }
                            <div class="media-grid">
                                <!-- Upload source picker -->
                                <div class="add-media-wrap">
                                    <button class="add-media-btn" (click)="toggleUploadPicker()">
                                        <ap-symbol symbolId="plus" size="sm" color="basic-grey"></ap-symbol>
                                    </button>
                                    @if (showUploadPicker()) {
                                        <div class="upload-picker">
                                            <button class="upload-option" (click)="pickFromComputer()">
                                                <ap-symbol symbolId="image" size="xs" color="basic-grey"></ap-symbol>
                                                From computer
                                            </button>
                                            <button class="upload-option" (click)="openLibrary()">
                                                <ap-symbol symbolId="folder" size="xs" color="basic-grey"></ap-symbol>
                                                From Library
                                            </button>
                                            <button class="upload-option" [class.disabled]="!googleDriveConnected" (click)="openGoogleDrive()">
                                                <ap-symbol symbolId="image" size="xs" color="basic-grey"></ap-symbol>
                                                Google Drive
                                                @if (!googleDriveConnected) {
                                                    <span class="upload-option-suffix">Connect</span>
                                                }
                                            </button>
                                            <button class="upload-option" [class.disabled]="!canvaConnected" (click)="openCanva()">
                                                <ap-symbol symbolId="pen" size="xs" color="basic-grey"></ap-symbol>
                                                Design with Canva
                                                @if (!canvaConnected) {
                                                    <span class="upload-option-suffix">Connect</span>
                                                }
                                            </button>
                                        </div>
                                    }
                                </div>
                                @for (item of state.mediaItems(); track item.id) {
                                    <div class="media-thumb">
                                        <img [src]="item.url" alt="Media" />
                                        <div class="media-overlay">
                                            <div class="media-menu-wrap">
                                                <ap-icon-button class="media-overlay-btn" type="flat" size="small" symbolId="more" ariaLabel="Media options" (onClick)="toggleMediaMenu(item.id)"></ap-icon-button>
                                                @if (mediaMenuOpenId() === item.id) {
                                                    <div class="media-menu">
                                                        <ap-button class="media-menu-item" [config]="{style:'ghost',color:'grey'}" size="small" (click)="replaceMedia(item.id)">Replace</ap-button>
                                                        <ap-button class="media-menu-item" [config]="{style:'ghost',color:'red'}" size="small" (click)="removeMedia(item.id)">Remove</ap-button>
                                                    </div>
                                                }
                                            </div>
                                            <ap-icon-button class="media-overlay-btn" type="flat" size="small" symbolId="trash" ariaLabel="Remove media" (onClick)="removeMedia(item.id)"></ap-icon-button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </div>

                <!-- ── Network options ────────────────────────────────────── -->
                <div class="section last">
                    <div class="section-header">
                        <span class="collapsible-title">Network options</span>
                    </div>
                    <p class="network-hint">Defaults applied to all profiles per network. Customize a profile to override individually.</p>

                    <!-- Facebook -->
                    @if (state.facebookProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('facebook')" (click)="fbOptionsExpanded.set(!fbOptionsExpanded())">
                                <div class="row-gap">
                                    <ap-symbol symbolId="facebook" size="sm" color="facebook"></ap-symbol>
                                    <span class="network-label">Facebook options</span>
                                </div>
                                <ap-symbol [symbolId]="fbOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (fbOptionsExpanded()) {
                                <div class="network-card-content">
                                    <ap-tabs [selectedIndex]="fbTabIndex()" (tabChange)="setFbPostType($event.index)">
                                        <ap-tab label="Post"></ap-tab>
                                        <ap-tab label="Reel" symbolId="video"></ap-tab>
                                        <ap-tab label="Story"></ap-tab>
                                    </ap-tabs>
                                    <div class="field-group">
                                        <label class="field-label">Video title</label>
                                        <div class="field-textarea-wrap">
                                            <textarea class="field-textarea" [value]="state.fbVideoTitle()" (input)="state.fbVideoTitle.set(asTextarea($event))" placeholder="This is the title of the video" rows="3"></textarea>
                                            <div class="field-textarea-footer">
                                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat" size="small"></ap-icon-button>
                                                <ap-button [config]="{ style: 'mermaid' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                            </div>
                                        </div>
                                        <div class="char-counts" style="padding: var(--ref-spacing-xxxs) 0 0;">
                                            <span class="char-count"><ap-symbol symbolId="facebook" size="xs" color="facebook"></ap-symbol> {{ state.fbCharsRemaining() | number }}</span>
                                        </div>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Boost this post</span><span class="option-hint">Text about what is post boosting</span></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="ad" symbolPosition="left">Boost Post</ap-button>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                        <ap-toggle name="fbFirstComment" [checked]="state.fbFirstComment()" (change)="state.fbFirstComment.set($event)"></ap-toggle>
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

                    <!-- Instagram -->
                    @if (state.instagramProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('instagram')" (click)="igOptionsExpanded.set(!igOptionsExpanded())">
                                <div class="row-gap">
                                    <ap-symbol symbolId="instagram" size="sm" color="instagram"></ap-symbol>
                                    <span class="network-label">Instagram options</span>
                                </div>
                                <ap-symbol [symbolId]="igOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (igOptionsExpanded()) {
                                <div class="network-card-content">
                                    <ap-tabs [selectedIndex]="igTabIndex()" (tabChange)="setIgPostType($event.index)">
                                        <ap-tab label="Post"></ap-tab>
                                        <ap-tab label="Reel" symbolId="video"></ap-tab>
                                        <ap-tab label="Story"></ap-tab>
                                    </ap-tabs>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                        <ap-toggle name="igMobileNotif" [checked]="state.igMobileNotif()" (change)="state.igMobileNotif.set($event)"></ap-toggle>
                                    </div>
                                    @if (igPostType() === 'reel') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Also share to Feed</span></div>
                                            <ap-toggle name="igAlsoShareToFeed" [checked]="state.igAlsoShareToFeed()" (change)="state.igAlsoShareToFeed.set($event)"></ap-toggle>
                                        </div>
                                    }
                                    @if (igPostType() !== 'story') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                            <ap-toggle name="igFirstComment" [checked]="state.igFirstComment()" (change)="state.igFirstComment.set($event)"></ap-toggle>
                                        </div>
                                        @if (state.igFirstComment()) {
                                            <div class="first-comment-editor">
                                                <textarea class="post-textarea small" [value]="state.igFirstCommentText()" (input)="state.igFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                            </div>
                                        }
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">PulseLink in Bio</span><span class="option-hint">Add a link to your content on your PulseLink</span></div>
                                            <ap-toggle name="igPulseLink" [checked]="state.igPulseLink()" (change)="state.igPulseLink.set($event)"></ap-toggle>
                                        </div>
                                        @if (igPostType() === 'post') {
                                            <div class="option-row action-row">
                                                <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag users</span><span class="option-hint">No users</span></div></div>
                                                <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left" (click)="openTagModal()">{{ tagUsersLabel() }}</ap-button>
                                            </div>
                                        }
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Invite collaborator(s)</span><span class="option-hint">No collaborator(s)</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left" (click)="openCollabModal()">{{ collabLabel() }}</ap-button>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="product-tag" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag products</span><span class="option-hint">No products</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="product-tag" symbolPosition="left">Tag products</ap-button>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <!-- LinkedIn -->
                    @if (state.linkedinProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('linkedin')" (click)="liOptionsExpanded.set(!liOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="linkedin" size="sm" color="linkedin"></ap-symbol><span class="network-label">LinkedIn options</span></div>
                                <ap-symbol [symbolId]="liOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (liOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                        <ap-toggle name="liFirstComment" [checked]="state.liFirstComment()" (change)="state.liFirstComment.set($event)"></ap-toggle>
                                    </div>
                                    @if (state.liFirstComment()) {
                                        <div class="first-comment-editor">
                                            <textarea class="post-textarea small" [value]="state.liFirstCommentText()" (input)="state.liFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                        </div>
                                    }
                                    <div class="option-section-title">Target audience settings</div>
                                    <div class="option-section-desc">Define the audience to display your post to</div>
                                    <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" size="small" symbolId="plus" symbolPosition="left">Add industry</ap-button>
                                    <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" size="small" symbolId="plus" symbolPosition="left">Add job function</ap-button>
                                    <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" size="small" symbolId="plus" symbolPosition="left">Add seniority</ap-button>
                                </div>
                            }
                        </div>
                    }

                    <!-- X (Twitter) -->
                    @if (state.twitterProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('twitter')" (click)="xOptionsExpanded.set(!xOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="x-official" size="sm" color="twitter"></ap-symbol><span class="network-label">X (Twitter) options</span></div>
                                <ap-symbol [symbolId]="xOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (xOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">X (Twitter) card</span><span class="option-hint">Post as an image instead of a X (Twitter) Card</span></div>
                                        <ap-toggle name="xTwitterCard" [checked]="state.xTwitterCard()" (change)="state.xTwitterCard.set($event)"></ap-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">X (Twitter) Thread</span><span class="option-hint">Publish a thread attached to your post</span></div>
                                        <ap-toggle name="xThread" [checked]="state.xThread()" (change)="state.xThread.set($event)"></ap-toggle>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    <!-- TikTok -->
                    @if (state.tiktokProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('tiktok')" (click)="ttOptionsExpanded.set(!ttOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="tiktok-official" size="sm" color="tiktok"></ap-symbol><span class="network-label">TikTok options</span></div>
                                <ap-symbol [symbolId]="ttOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (ttOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Allow comments</span></div>
                                        <ap-toggle name="ttAllowComments" [checked]="state.ttAllowComments()" (change)="state.ttAllowComments.set($event)"></ap-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Allow Duet</span><span class="option-hint">Allows you to post your video side-by-side with another creator's video</span></div>
                                        <ap-toggle name="ttAllowDuet" [checked]="state.ttAllowDuet()" (change)="state.ttAllowDuet.set($event)"></ap-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Allow Stitch</span><span class="option-hint">Allows you to combine another video on TikTok with one you're creating</span></div>
                                        <ap-toggle name="ttAllowStitch" [checked]="state.ttAllowStitch()" (change)="state.ttAllowStitch.set($event)"></ap-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                        <ap-toggle name="ttMobileNotif" [checked]="state.ttMobileNotif()" (change)="state.ttMobileNotif.set($event)"></ap-toggle>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    <!-- YouTube -->
                    @if (state.youtubeProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('youtube')" (click)="ytOptionsExpanded.set(!ytOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="youtube" size="sm" color="youtube"></ap-symbol><span class="network-label">YouTube options</span></div>
                                <ap-symbol [symbolId]="ytOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (ytOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="field-group">
                                        <label class="field-label">Video title <span class="required-star">*</span></label>
                                        <div class="field-textarea-wrap">
                                            <textarea class="field-textarea" [value]="state.ytTitle()" (input)="state.ytTitle.set(asTextarea($event))" placeholder="Write a description with text, links..." rows="3"></textarea>
                                            <div class="field-textarea-footer">
                                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat" size="small"></ap-icon-button>
                                                <ap-button [config]="{ style: 'mermaid' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                            </div>
                                        </div>
                                        <div class="char-counts" style="padding: var(--ref-spacing-xxxs) 0 0;">
                                            <span class="char-count" [class.danger]="state.ytTitle().length > 280"><ap-symbol symbolId="youtube" size="xs" [color]="state.ytTitle().length > 280 ? 'red' : 'youtube'"></ap-symbol> {{ 280 - state.ytTitle().length }}</span>
                                        </div>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Privacy status</span></div>
                                        <div class="privacy-tabs">
                                            <ap-button class="privacy-btn-left" [config]="state.ytPrivacy()==='public' ? {style:'primary',color:'blue'} : {style:'stroked',color:'grey'}" size="small" (click)="state.ytPrivacy.set('public')">Public</ap-button>
                                            <ap-button class="privacy-btn-right" [config]="state.ytPrivacy()==='private' ? {style:'primary',color:'blue'} : {style:'stroked',color:'grey'}" size="small" (click)="state.ytPrivacy.set('private')">Private</ap-button>
                                        </div>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">Category</label>
                                        <select class="field-select"><option value="">Select Category</option></select>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">Playlist</label>
                                        <select class="field-select"><option value="">Select a playlist</option></select>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">YouTube Video tags <span class="optional-label">(optional)</span></label>
                                        <input class="field-input" type="text" placeholder="Type your video tags" />
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">License <span class="optional-label">(optional)</span></label>
                                        <select class="field-select"><option value="">Select a license</option></select>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Embeddable</span><span class="option-hint">Allow others to embed your video on their sites</span></div>
                                        <ap-toggle name="ytEmbeddable" [checked]="state.ytEmbeddable()" (change)="state.ytEmbeddable.set($event)"></ap-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Notify subscribers</span></div>
                                        <ap-toggle name="ytNotifySubscribers" [checked]="state.ytNotifySubscribers()" (change)="state.ytNotifySubscribers.set($event)"></ap-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Made for kids</span><span class="option-hint">Prevent underage users from watching this video. This also removes the ability to monetize or promote your video through different ad formats.</span></div>
                                        <ap-toggle name="ytMadeForKids" [checked]="state.ytMadeForKids()" (change)="state.ytMadeForKids.set($event)"></ap-toggle>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    @if (state.selectedProfiles().length === 0) {
                        <p class="empty-hint">Select profiles to see network‑specific options.</p>
                    }
                </div>

            } @else {
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
                        } @else {
                            <p class="customizations-hint">Each card below overrides the base post for that profile.</p>
                        }

                        @for (custom of state.activeCustomizations(); track custom.profileId) {
                            <div
                                class="custom-card"
                                [attr.data-custom-id]="custom.profileId"
                                [class.flash-highlight]="flashingId() === custom.profileId"
                                [class.has-error]="customHasError(custom.profileId, custom.text)">
                                <!-- card header -->
                                <div class="custom-card-header" [style.background]="networkHeaderBg(profileNetwork(custom.profileId))">
                                    <div class="profile-row">
                                        <ap-avatar
                                            [username]="profileName(custom.profileId)"
                                            [network]="profileNetwork(custom.profileId)"
                                            [size]="24">
                                        </ap-avatar>
                                        <span class="profile-label">{{ profileName(custom.profileId) }}</span>
                                        @if (customHasError(custom.profileId, custom.text)) {
                                            <ap-symbol symbolId="error" size="xs" color="red" [apTooltip]="'Character limit exceeded for this network'" apTooltipPosition="top" [apTooltipShowDelay]="200"></ap-symbol>
                                        }
                                    </div>
                                    <div class="row-gap">
                                        <ap-icon-button
                                            symbolId="refresh"
                                            ariaLabel="Reset to base text"
                                            type="flat"
                                            size="small"
                                            [apTooltip]="'Reset to base post content'"
                                            apTooltipPosition="bottom"
                                            [apTooltipShowDelay]="400"
                                            (onClick)="state.resetCustomization(custom.profileId)">
                                        </ap-icon-button>
                                        <ap-icon-button
                                            symbolId="close"
                                            ariaLabel="Remove customization"
                                            type="flat"
                                            size="small"
                                            [apTooltip]="'Remove this override'"
                                            apTooltipPosition="bottom"
                                            [apTooltipShowDelay]="400"
                                            (onClick)="state.removeCustomization(custom.profileId)">
                                        </ap-icon-button>
                                    </div>
                                </div>

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
                                            <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat" [apTooltip]="'Add an emoji'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                            <ap-icon-button symbolId="pin" ariaLabel="Location" type="flat" [apTooltip]="'Tag a location'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                            <ap-icon-button symbolId="hashtag" ariaLabel="Hashtag" type="flat" [apTooltip]="'Add hashtags'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                            <ap-icon-button symbolId="variable" ariaLabel="Variable" type="flat" [apTooltip]="'Insert a variable'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                            <ap-icon-button symbolId="sparkles" ariaLabel="Writing Assistant" type="flat" [apTooltip]="'Writing Assistant'" apTooltipPosition="bottom" [apTooltipShowDelay]="400"></ap-icon-button>
                                        </div>
                                    </div>
                                </div>

                                <!-- char count -->
                                <div class="char-counts inner">
                                    <span class="char-count"
                                        [class.danger]="custom.text.length > networkCharLimit(profileNetwork(custom.profileId))"
                                        [class.warning]="isNearLimit(custom.profileId, custom.text)">
                                        <ap-symbol
                                            [symbolId]="networkSymbol(profileNetwork(custom.profileId))"
                                            size="xs"
                                            [color]="charCountColor(custom.profileId, custom.text)">
                                        </ap-symbol>
                                        {{ (networkCharLimit(profileNetwork(custom.profileId)) - custom.text.length) | number }}
                                    </span>
                                </div>

                                <!-- per-profile media override -->
                                <div class="custom-media-section">
                                    <div class="custom-media-header">
                                        <span class="custom-media-label">Media</span>
                                        @if (custom.mediaItems.length === 0) {
                                            <span class="custom-media-hint">Using base media</span>
                                        }
                                    </div>
                                    <div class="media-grid">
                                        <button class="add-media-btn small" (click)="addCustomMedia(custom.profileId)" [apTooltip]="'Override media for this profile'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                            <ap-symbol symbolId="plus" size="xs" color="basic-grey"></ap-symbol>
                                        </button>
                                        @for (item of custom.mediaItems; track item.id) {
                                            <div class="media-thumb small">
                                                <img [src]="item.url" alt="Media" />
                                                <div class="media-overlay">
                                                    <button (click)="state.removeCustomizationMedia(custom.profileId, item.id)">
                                                        <ap-symbol symbolId="trash" size="xs" color="red"></ap-symbol>
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>

                                <!-- network-specific options -->
                                @switch (profileNetwork(custom.profileId)) {
                                    @case ('facebook') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                            <ap-toggle name="firstComment" [checked]="custom.firstComment" (change)="state.updateCustomizationFirstComment(custom.profileId, $event)"></ap-toggle>
                                        </div>
                                        @if (custom.firstComment) {
                                            <div class="first-comment-editor"><textarea class="post-textarea small" [value]="custom.firstCommentText" (input)="onFirstCommentInput($event, custom.profileId)" placeholder="Write your first comment…" rows="2"></textarea></div>
                                        }
                                        <div class="option-row">
                                            <div class="option-info"><span class="option-label">Boost this post</span><span class="option-hint">Text about what is post boosting</span></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="ad" symbolPosition="left">Boost Post</ap-button>
                                        </div>
                                    }
                                    @case ('instagram') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                            <ap-toggle name="igMobileNotif" [checked]="state.igMobileNotif()" (change)="state.igMobileNotif.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                            <ap-toggle name="firstComment" [checked]="custom.firstComment" (change)="state.updateCustomizationFirstComment(custom.profileId, $event)"></ap-toggle>
                                        </div>
                                        @if (custom.firstComment) {
                                            <div class="first-comment-editor"><textarea class="post-textarea small" [value]="custom.firstCommentText" (input)="onFirstCommentInput($event, custom.profileId)" placeholder="Write your first comment…" rows="2"></textarea></div>
                                        }
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">PulseLink in Bio</span><span class="option-hint">Add a link to your content on your PulseLink</span></div>
                                            <ap-toggle name="igPulseLink" [checked]="state.igPulseLink()" (change)="state.igPulseLink.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag users</span><span class="option-hint">No users</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left" (click)="openTagModal()">{{ tagUsersLabel() }}</ap-button>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Invite collaborator(s)</span><span class="option-hint">No collaborator(s)</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left" (click)="openCollabModal()">{{ collabLabel() }}</ap-button>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="product-tag" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag products</span><span class="option-hint">No products</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="product-tag" symbolPosition="left">Tag products</ap-button>
                                        </div>
                                    }
                                    @case ('linkedin') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                            <ap-toggle name="firstComment" [checked]="custom.firstComment" (change)="state.updateCustomizationFirstComment(custom.profileId, $event)"></ap-toggle>
                                        </div>
                                        @if (custom.firstComment) {
                                            <div class="first-comment-editor"><textarea class="post-textarea small" [value]="custom.firstCommentText" (input)="onFirstCommentInput($event, custom.profileId)" placeholder="Write your first comment…" rows="2"></textarea></div>
                                        }
                                        <div class="option-section-title">Target audience settings</div>
                                        <div class="option-section-desc">Define the audience to display your post to</div>
                                        <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" size="small" symbolId="plus" symbolPosition="left">Add industry</ap-button>
                                        <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" size="small" symbolId="plus" symbolPosition="left">Add job function</ap-button>
                                        <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" size="small" symbolId="plus" symbolPosition="left">Add seniority</ap-button>
                                    }
                                    @case ('twitter') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">X (Twitter) card</span><span class="option-hint">Post as an image instead of a X (Twitter) Card</span></div>
                                            <ap-toggle name="xTwitterCard" [checked]="state.xTwitterCard()" (change)="state.xTwitterCard.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">X (Twitter) Thread</span><span class="option-hint">Publish a thread attached to your post</span></div>
                                            <ap-toggle name="xThread" [checked]="state.xThread()" (change)="state.xThread.set($event)"></ap-toggle>
                                        </div>
                                    }
                                    @case ('tiktok') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Allow comments</span></div>
                                            <ap-toggle name="ttAllowComments" [checked]="state.ttAllowComments()" (change)="state.ttAllowComments.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Allow Duet</span><span class="option-hint">Allows you to post your video side-by-side with another creator's video</span></div>
                                            <ap-toggle name="ttAllowDuet" [checked]="state.ttAllowDuet()" (change)="state.ttAllowDuet.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Allow Stitch</span><span class="option-hint">Allows you to combine another video on TikTok with one you're creating</span></div>
                                            <ap-toggle name="ttAllowStitch" [checked]="state.ttAllowStitch()" (change)="state.ttAllowStitch.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                            <ap-toggle name="ttMobileNotif" [checked]="state.ttMobileNotif()" (change)="state.ttMobileNotif.set($event)"></ap-toggle>
                                        </div>
                                    }
                                    @case ('youtube') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Embeddable</span><span class="option-hint">Allow others to embed your video on their sites</span></div>
                                            <ap-toggle name="ytEmbeddable" [checked]="state.ytEmbeddable()" (change)="state.ytEmbeddable.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Notify subscribers</span></div>
                                            <ap-toggle name="ytNotifySubscribers" [checked]="state.ytNotifySubscribers()" (change)="state.ytNotifySubscribers.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Made for kids</span><span class="option-hint">Prevent underage users from watching this video.</span></div>
                                            <ap-toggle name="ytMadeForKids" [checked]="state.ytMadeForKids()" (change)="state.ytMadeForKids.set($event)"></ap-toggle>
                                        </div>
                                    }
                                }
                            </div>
                        }
                    }
                </div>

            } <!-- end @if customized -->
            </div>
        </div>

        @if (tagModalOpen()) {
            <div class="tag-modal-overlay" (click)="closeTagModal()">
                <div class="tag-modal" (click)="$event.stopPropagation()">
                    <div class="tag-modal-header">
                        <span class="tag-modal-title">Tag users</span>
                        <ap-icon-button type="flat" size="small" symbolId="close" ariaLabel="Close" (onClick)="closeTagModal()"></ap-icon-button>
                    </div>

                    <div class="tag-modal-image-area" (click)="onTagImageClick($event)">
                        @if (tagModalImage()) {
                            <img class="tag-modal-img" [src]="tagModalImage()!.url" alt="Post image" />
                        } @else {
                            <div class="tag-modal-no-image">No image available — add an image to the post first</div>
                        }

                        @for (tag of tagModalTags(); track tag.id) {
                            <div class="tag-pin" [style.left.%]="tag.x" [style.top.%]="tag.y">
                                <div class="tag-pin-dot"></div>
                                <div class="tag-pin-badge">
                                    <span>&#64;{{ tag.username }}</span>
                                    <button class="tag-pin-remove" (click)="$event.stopPropagation(); removeTag(tag.id)">×</button>
                                </div>
                            </div>
                        }

                        @if (pendingPin()) {
                            <div class="tag-pin pending" [style.left.%]="pendingPin()!.x" [style.top.%]="pendingPin()!.y" (click)="$event.stopPropagation()">
                                <div class="tag-pin-dot"></div>
                                <div class="tag-autocomplete">
                                    <input class="tag-autocomplete-input" type="text" placeholder="Search username…"
                                        [value]="tagSearchQuery()"
                                        (input)="tagSearchQuery.set(asTextarea($event))"
                                        autofocus />
                                    @if (tagSuggestions().length > 0) {
                                        <div class="tag-autocomplete-list">
                                            @for (s of tagSuggestions(); track s) {
                                                <div class="tag-autocomplete-item" (click)="selectTagSuggestion(s)">&#64;{{ s }}</div>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    <div class="tag-modal-footer">
                        <ap-button [config]="{ style: 'ghost', color: 'grey' }" (click)="closeTagModal()">Cancel</ap-button>
                        <ap-button [config]="{ style: 'primary', color: 'orange' }" (click)="saveTagModal()">Save tags</ap-button>
                    </div>
                </div>
            </div>
        }

        @if (collabModalOpen()) {
            <div class="collab-modal-overlay" (click)="closeCollabModal()">
                <div class="collab-modal" (click)="$event.stopPropagation()">
                    <div class="collab-modal-header">
                        <div class="collab-modal-titles">
                            <span class="collab-modal-title">Invite Collaborators</span>
                            <span class="collab-modal-subtitle">Up to 3 collaborators can be invited to this post</span>
                        </div>
                        <ap-icon-button type="flat" size="small" symbolId="close" ariaLabel="Close" (onClick)="closeCollabModal()"></ap-icon-button>
                    </div>
                    <div class="collab-modal-body">
                        @if (collabPending().length < 3) {
                            <div class="collab-search-container">
                                <div class="collab-search-wrap">
                                    <ap-symbol symbolId="search" size="xs" color="basic-grey"></ap-symbol>
                                    <input
                                        class="collab-search-input"
                                        type="text"
                                        placeholder="Search Instagram accounts…"
                                        [value]="collabSearchQuery()"
                                        (input)="collabSearchQuery.set(asTextarea($event))"
                                        autofocus />
                                </div>
                                @if (collabSuggestions().length > 0) {
                                    <div class="collab-dropdown">
                                        @for (user of collabSuggestions(); track user.handle) {
                                            <div class="collab-dropdown-item" (click)="selectCollaborator(user)">
                                                <img class="collab-avatar-lg" [src]="user.avatar" [alt]="user.name" />
                                                <div class="collab-user-info">
                                                    <span class="collab-user-name">{{ user.name }}</span>
                                                    <span class="collab-user-handle">{{ user.handle }}</span>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        } @else {
                            <div class="collab-max-reached">Maximum of 3 collaborators reached</div>
                        }
                        @if (collabPending().length > 0) {
                            <div class="collab-chips">
                                @for (user of collabPending(); track user.handle) {
                                    <div class="collab-chip">
                                        <img class="collab-avatar-sm" [src]="user.avatar" [alt]="user.name" />
                                        <span class="collab-chip-handle">{{ user.handle }}</span>
                                        <button class="collab-chip-remove" (click)="removeCollaborator(user.handle)">×</button>
                                    </div>
                                }
                            </div>
                        }
                    </div>
                    <div class="collab-modal-footer">
                        <ap-button [config]="{ style: 'ghost', color: 'grey' }" (click)="closeCollabModal()">Cancel</ap-button>
                        <ap-button [config]="{ style: 'primary', color: 'orange' }" (click)="confirmCollabModal()">Confirm</ap-button>
                    </div>
                </div>
            </div>
        }
    `,
    styles: [`
        :host { display: flex; flex: 1; min-width: 0; min-height: 0; max-width: 50%; }
        .compose-panel {
            display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0;
            background: var(--ref-color-white);
            border-right: 1px solid var(--sys-border-color-default);
            overflow: hidden;
        }
        .compose-tabs {
            display: flex; align-items: center;
            border-bottom: 1px solid var(--ref-color-grey-20);
            flex-shrink: 0;
            background: var(--ref-color-grey-bg);
            transition: background 0.2s, border-color 0.2s;
        }
        .compose-panel.is-draft .compose-tabs {
            background: var(--ref-color-yellow-10);
            border-bottom-color: var(--ref-color-yellow-40);
        }
        .compose-tab-nav {
            flex: 1; min-width: 0;
            ::ng-deep .ap-tabs__content { display: none; }
            ::ng-deep .ap-tabs__nav { border-bottom: none; }
        }
        .draft-toggle-tab {
            flex-shrink: 0; margin-left: auto; display: flex; align-items: center; gap: 7px;
            cursor: pointer; padding: 0 16px 0 8px; border-radius: 20px;
            transition: background 0.15s;
        }
        .draft-toggle-label {
            font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold);
            color: var(--sys-text-color-light);
            transition: color 0.15s;
        }
        .draft-toggle-tab.is-on .draft-toggle-label {
            color: var(--ref-color-yellow-150);
        }
        .panel-header {
            padding: 16px 0 12px; font-size: var(--ref-font-size-md); font-weight: var(--ref-font-weight-bold);
            color: var(--sys-text-color-default);
        }
        .compose-content { flex: 1; min-height: 0; overflow-y: auto; padding: 0 16px 24px; background: var(--ref-color-white); }
        .section { padding: 16px 0; max-width: 640px; margin: 0 auto; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .section-title { display: flex; align-items: center; gap: 6px; font-size: var(--ref-font-size-sm); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .section-hint { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); }

        .text-editor {
            border: 1px solid var(--sys-border-color-default); border-radius: var(--ref-radius-md); overflow: hidden;
            background: var(--ref-color-white); transition: border-color 0.15s, box-shadow 0.15s;
            &.inner { border-radius: 6px; margin: 8px 0; }
            &.focused { border-color: var(--ref-color-electric-blue-60); box-shadow: 0 0 0 3px var(--ref-color-electric-blue-05); }
            textarea { min-height: 96px; transition: min-height 0.25s ease; }
            &.expanded textarea { min-height: 280px; }
        }
        .post-textarea {
            width: 100%; padding: 8px 12px; border: none; outline: none; resize: none;
            font-size: var(--ref-font-size-sm); color: var(--sys-text-color-default);
            font-family: var(--ref-font-family); background: transparent; line-height: var(--ref-font-line-height-sm);
            box-sizing: border-box;
            &.small { padding: 8px 12px; font-size: var(--ref-font-size-xs); }
            &::placeholder { color: var(--ref-color-grey-60); }
        }
        .editor-toolbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 8px; border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-white);
        }
        .toolbar-icons { display: flex; }
        .toolbar-right { display: flex; align-items: center; gap: 4px; }
        .editor-footer {
            display: flex; align-items: center;
            padding: 8px 12px; border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-grey-05);
        }
        .char-counts { display: flex; gap: 12px; &.inner { padding: 4px 12px 8px; } }
        .char-count {
            display: flex; align-items: center; gap: 4px; font-size: var(--ref-font-size-xs);
            color: var(--ref-color-electric-blue-100);
            &.grey { color: var(--ref-color-grey-60); }
            &.warning { color: var(--ref-color-orange-100); }
            &.danger { color: var(--ref-color-red-100); font-weight: var(--ref-font-weight-bold); }
        }

        .collapsible-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 0 12px; cursor: pointer; user-select: none;
            &.padded { padding: 12px; }
        }
        .collapsible-title { display: flex; align-items: center; gap: 8px; font-size: var(--ref-font-size-sm); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .section-count { font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-regular); color: var(--ref-color-grey-60); }

        .media-grid { display: flex; gap: 8px; flex-wrap: wrap; &.inner { padding: 0 12px 8px; } }
        .add-media-btn {
            width: 96px; height: 96px; border: 2px dashed var(--ref-color-grey-40);
            border-radius: var(--ref-radius-md); background: transparent; cursor: pointer;
            display: flex; align-items: center; justify-content: center; transition: all 0.15s;
            &:hover { background: var(--ref-color-grey-05); border-color: var(--ref-color-electric-blue-60); }
        }
        .media-thumb {
            position: relative; width: 96px; height: 96px; border-radius: var(--ref-radius-md); overflow: hidden;
            img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .media-overlay {
                position: absolute; top: 4px; right: 4px; display: flex; gap: 4px;
                opacity: 0; transition: opacity 0.15s;
            }
            .media-overlay-btn {
                ::ng-deep button { width: 24px; min-width: 24px; height: 24px; min-height: 24px; padding: 0; border-radius: var(--ref-radius-sm); background: rgba(255,255,255,0.92) !important; }
            }
            &:hover .media-overlay { opacity: 1; }
        }

        /* Upload source picker popover */
        .add-media-wrap { position: relative; }
        .upload-picker {
            position: absolute; top: calc(100% + 4px); left: 0; z-index: 100;
            background: var(--ref-color-white); border: 1px solid var(--sys-border-color-default);
            border-radius: var(--ref-radius-md); box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            padding: 4px; min-width: 180px;
        }
        .upload-option {
            display: flex; align-items: center; gap: 8px; width: 100%;
            background: none; border: none; border-radius: var(--ref-radius-md);
            padding: 8px 12px; font-size: var(--ref-font-size-sm); font-weight: var(--ref-font-weight-regular);
            color: var(--sys-text-color-default); cursor: pointer;
            font-family: var(--ref-font-family); text-align: left;
            transition: background 0.15s;
            &:hover:not(.disabled) { background: var(--ref-color-grey-05); }
            &.disabled { opacity: 0.5; cursor: not-allowed; }
        }
        .upload-option-suffix {
            margin-left: auto; font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold);
            color: var(--ref-color-electric-blue-100);
        }

        /* Drag & drop zone */
        .media-drop-zone {
            position: relative; border-radius: 8px;
            transition: background 0.15s, border-color 0.15s;
            &.drag-over {
                background: var(--ref-color-electric-blue-05);
                outline: 2px dashed var(--ref-color-electric-blue-60);
            }
        }
        .drop-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 8px; background: var(--ref-color-electric-blue-05);
            border-radius: 8px; pointer-events: none;
            font-size: var(--ref-font-size-sm); font-weight: var(--ref-font-weight-bold); color: var(--ref-color-electric-blue-100);
        }

        /* Per-thumb ⋯ menu */
        .media-menu-wrap { position: relative; }
        .media-menu {
            position: absolute; top: calc(100% + 4px); right: 0; z-index: 110;
            background: var(--ref-color-white); border: 1px solid var(--sys-border-color-default);
            border-radius: var(--ref-radius-md); box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            padding: 4px; min-width: 120px;
        }
        .media-menu-item {
            display: block; width: 100%;
            ::ng-deep button { justify-content: flex-start !important; width: 100%; border-radius: var(--ref-radius-md); }
        }

        /* Customizations section hint */
        .customizations-hint { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); margin: 0 0 8px; }

        /* Customization cards */
        .custom-card {
            border: 1px solid var(--sys-border-color-default);
            border-radius: var(--ref-radius-md);
            overflow: hidden; margin-bottom: 8px; background: var(--ref-color-white);
            transition: box-shadow 0.2s, border-color 0.2s;
            &.has-error { border-color: var(--ref-color-red-60); }
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
            transition: background 0.15s;
        }
        .profile-row { display: flex; align-items: center; gap: 8px; }
        .profile-label { font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .row-gap { display: flex; align-items: center; gap: 6px; }
        .inner-pad { padding: 8px 12px; }

        .option-row {
            display: flex; align-items: flex-start; justify-content: space-between;
            padding: 12px; border-top: 1px solid var(--ref-color-grey-10); gap: 12px;
            &.toggle-row { align-items: center; }
            &.action-row { align-items: center; }
        }
        .option-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .option-info-row { display: flex; align-items: center; gap: 8px; flex: 1; }
        .option-label { font-size: var(--ref-font-size-sm); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .option-hint { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); line-height: var(--ref-font-line-height-xs); }

        .first-comment-editor {
            padding: 8px 12px 12px;
            border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-grey-bg);
        }

        .network-hint { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); margin: 0 0 8px; line-height: var(--ref-font-line-height-xs); }
        .network-card { border: 1px solid var(--sys-border-color-default); border-radius: var(--ref-radius-md); margin-top: 12px; overflow: hidden; background: var(--ref-color-white); }
        .network-card-content { padding: 0 0 12px; }
        .network-label { font-size: var(--ref-font-size-sm); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .field-group {
            padding: 12px;
            .field-label { display: block; font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-light); margin-bottom: 4px; }
            .field-textarea {
                width: 100%; padding: 8px 10px; border: 1px solid var(--sys-border-color-default);
                border-radius: var(--ref-radius-md); font-size: var(--ref-font-size-xs); color: var(--sys-text-color-default);
                font-family: var(--ref-font-family); resize: none; outline: none;
                background: var(--ref-color-white); box-sizing: border-box;
                &::placeholder { color: var(--ref-color-grey-60); }
                &:focus { border-color: var(--ref-color-electric-blue-60); }
            }
        }
        .empty-hint { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); margin: 4px 0 0; }

        /* Per-profile media override */
        .custom-media-section {
            padding: 8px 12px 10px;
            border-top: 1px solid var(--ref-color-grey-10);
        }
        .custom-media-header {
            display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
        }
        .custom-media-label { font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold); color: var(--sys-text-color-default); }
        .custom-media-hint { font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); }
        .add-media-btn.small { width: 48px; height: 48px; }
        .media-thumb.small { width: 48px; height: 48px; border-radius: 6px; }

        /* ap-tabs inside network cards — collapse empty content area */
        .network-card-content ap-tabs { display: block; }
        .network-card-content ap-tabs ::ng-deep > div > div:last-child { display: none !important; }

        /* LinkedIn audience targeting */
        .option-section-title {
            padding: 10px 12px 2px; font-size: var(--ref-font-size-xs); font-weight: var(--ref-font-weight-bold);
            color: var(--sys-text-color-light); text-transform: uppercase; letter-spacing: 0.04em;
            border-top: 1px solid var(--ref-color-grey-10);
        }
        .option-section-desc { padding: 2px 12px 6px; font-size: var(--ref-font-size-xs); color: var(--ref-color-grey-60); line-height: var(--ref-font-line-height-xs); }
        .audience-btn {
            display: block;
            border-top: 1px solid var(--ref-color-grey-10);
            ::ng-deep button { justify-content: flex-start !important; padding-left: 12px; width: 100%; }
        }

        /* Textarea with footer toolbar (Facebook/YouTube video title) */
        .field-textarea-wrap { position: relative; }
        .field-textarea-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 6px 4px 2px; border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-white);
        }

        /* Form fields for YouTube */
        .field-select {
            width: 100%; padding: 8px 12px; border: 1px solid var(--sys-border-color-default);
            border-radius: var(--ref-radius-md); font-size: var(--ref-font-size-xs); color: var(--sys-text-color-default);
            font-family: var(--ref-font-family); background: var(--ref-color-white);
            outline: none; cursor: pointer;
            &:focus { border-color: var(--ref-color-electric-blue-60); }
        }
        .field-input {
            width: 100%; padding: 8px 12px; border: 1px solid var(--sys-border-color-default);
            border-radius: var(--ref-radius-md); font-size: var(--ref-font-size-xs); color: var(--sys-text-color-default);
            font-family: var(--ref-font-family); background: var(--ref-color-white);
            outline: none; box-sizing: border-box;
            &::placeholder { color: var(--ref-color-grey-60); }
            &:focus { border-color: var(--ref-color-electric-blue-60); }
        }
        .required-star { color: var(--ref-color-red-100); }
        .optional-label { color: var(--ref-color-grey-60); font-weight: var(--ref-font-weight-regular); }

        /* Privacy button group (YouTube) */
        .privacy-tabs { display: flex; }
        .privacy-btn-left ::ng-deep button { border-radius: var(--comp-button-border-radius) 0 0 var(--comp-button-border-radius) !important; border-right: none !important; }
        .privacy-btn-right ::ng-deep button { border-radius: 0 var(--comp-button-border-radius) var(--comp-button-border-radius) 0 !important; }

        /* Tag Modal */
        .tag-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        }
        .tag-modal {
            background: #ffffff;
            border-radius: var(--ref-radius-xl);
            width: 520px; max-width: 90vw;
            display: flex; flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }
        .tag-modal-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .tag-modal-title {
            font-size: var(--ref-font-size-md);
            font-weight: var(--ref-font-weight-bold);
            line-height: var(--ref-font-line-height-lg);
            color: var(--sys-text-color-default);
        }
        .tag-modal-image-area {
            position: relative;
            cursor: crosshair;
            background: var(--ref-color-grey-10);
            aspect-ratio: 1;
            overflow: hidden;
        }
        .tag-modal-img {
            width: 100%; height: 100%;
            object-fit: cover; display: block;
        }
        .tag-modal-no-image {
            display: flex; align-items: center; justify-content: center;
            height: 100%; color: var(--ref-color-grey-60);
            font-size: var(--ref-font-size-sm);
            text-align: center; padding: var(--ref-spacing-md);
        }
        .tag-pin {
            position: absolute; transform: translate(-50%, -50%);
            display: flex; flex-direction: column; align-items: center; gap: var(--ref-spacing-xxxs);
            z-index: 10; pointer-events: none;
        }
        .tag-pin-dot {
            width: var(--ref-spacing-xs); height: var(--ref-spacing-xs);
            border-radius: var(--ref-radius-full);
            background: #ffffff;
            border: 2px solid var(--ref-color-grey-100);
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .tag-pin-badge {
            display: flex; align-items: center; gap: var(--ref-spacing-xxxs);
            background: rgba(0,0,0,0.7);
            color: #ffffff;
            font-size: var(--ref-font-size-xs);
            line-height: var(--ref-font-line-height-xs);
            padding: 2px 6px;
            border-radius: var(--ref-radius-sm);
            pointer-events: all; white-space: nowrap;
        }
        .tag-pin-remove {
            background: none; border: none; color: #ffffff;
            cursor: pointer; padding: 0; font-size: var(--ref-font-size-sm);
            line-height: var(--ref-font-line-height-sm);
        }
        .tag-autocomplete {
            pointer-events: all;
            display: flex; flex-direction: column;
            background: #ffffff;
            border: 1px solid var(--ref-color-grey-20);
            border-radius: var(--ref-radius-md);
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            min-width: 180px;
        }
        .tag-autocomplete-input {
            border: none; outline: none;
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            font-size: var(--ref-font-size-sm);
            font-family: var(--ref-font-family);
            color: var(--sys-text-color-default);
            background: transparent;
        }
        .tag-autocomplete-list { border-top: 1px solid var(--ref-color-grey-20); }
        .tag-autocomplete-item {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            font-size: var(--ref-font-size-sm);
            color: var(--sys-text-color-default);
            cursor: pointer;
            &:hover { background: var(--ref-color-grey-05); }
        }
        .tag-modal-footer {
            display: flex; justify-content: flex-end; gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        /* Invite Collaborators Modal */
        .collab-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        }
        .collab-modal {
            background: #ffffff;
            border-radius: var(--ref-radius-xl);
            width: 480px; max-width: 90vw;
            display: flex; flex-direction: column;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }
        .collab-modal-header {
            display: flex; align-items: flex-start; justify-content: space-between;
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
            border-bottom: 1px solid var(--sys-border-color-default);
            border-radius: var(--ref-radius-xl) var(--ref-radius-xl) 0 0;
            flex-shrink: 0;
        }
        .collab-modal-titles {
            display: flex; flex-direction: column; gap: var(--ref-spacing-xxxs);
        }
        .collab-modal-title {
            font-size: var(--ref-font-size-md);
            font-weight: var(--ref-font-weight-bold);
            line-height: var(--ref-font-line-height-lg);
            color: var(--sys-text-color-default);
        }
        .collab-modal-subtitle {
            font-size: var(--ref-font-size-xs);
            line-height: var(--ref-font-line-height-xs);
            color: var(--ref-color-grey-60);
        }
        .collab-modal-body {
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
            display: flex; flex-direction: column; gap: var(--ref-spacing-xxs);
        }
        .collab-search-container { position: relative; }
        .collab-search-wrap {
            display: flex; align-items: center; gap: var(--ref-spacing-xxs);
            height: 36px;
            padding: 0 var(--ref-spacing-xs);
            border: 1px solid var(--ref-color-grey-20);
            border-radius: var(--ref-radius-sm);
            background: #ffffff;
            &:focus-within { border-color: var(--ref-color-electric-blue-100); outline: 2px solid var(--ref-color-electric-blue-20); }
        }
        .collab-search-input {
            flex: 1; border: none; outline: none;
            font-size: var(--ref-font-size-sm);
            line-height: var(--ref-font-line-height-sm);
            font-family: var(--ref-font-family);
            color: var(--ref-color-grey-100);
            background: transparent;
            &::placeholder { color: var(--ref-color-grey-60); }
        }
        .collab-dropdown {
            position: absolute; top: calc(100% + var(--ref-spacing-xxxs));
            left: 0; right: 0; z-index: 10;
            border: 1px solid var(--ref-color-grey-20);
            border-radius: var(--ref-radius-md);
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .collab-dropdown-item {
            display: flex; align-items: center; gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xxs) var(--ref-spacing-sm);
            cursor: pointer;
            &:hover { background: var(--ref-color-grey-05); }
            & + & { border-top: 1px solid var(--ref-color-grey-10); }
        }
        .collab-avatar-lg {
            width: 32px; height: 32px;
            border-radius: var(--ref-radius-full);
            object-fit: cover; flex-shrink: 0;
        }
        .collab-user-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .collab-user-name {
            font-size: var(--ref-font-size-sm);
            font-weight: var(--ref-font-weight-bold);
            line-height: var(--ref-font-line-height-sm);
            color: var(--ref-color-grey-100);
        }
        .collab-user-handle {
            font-size: var(--ref-font-size-xs);
            line-height: var(--ref-font-line-height-xs);
            color: var(--ref-color-grey-60);
        }
        .collab-max-reached {
            font-size: var(--ref-font-size-xs);
            line-height: var(--ref-font-line-height-xs);
            color: var(--ref-color-grey-60);
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            background: var(--ref-color-grey-05);
            border-radius: var(--ref-radius-sm);
        }
        .collab-chips {
            display: flex; flex-wrap: wrap; gap: var(--ref-spacing-xxs);
        }
        .collab-chip {
            display: inline-flex; align-items: center; gap: var(--ref-spacing-xxxs);
            height: var(--ref-spacing-md);
            padding: 0 var(--ref-spacing-xxs);
            border-radius: var(--ref-radius-full);
            background: var(--ref-color-grey-10);
        }
        .collab-avatar-sm {
            width: var(--ref-spacing-md); height: var(--ref-spacing-md);
            border-radius: var(--ref-radius-full);
            object-fit: cover; flex-shrink: 0;
        }
        .collab-chip-handle {
            font-size: var(--ref-font-size-xs);
            line-height: var(--ref-font-line-height-xs);
            color: var(--ref-color-grey-100);
        }
        .collab-chip-remove {
            background: none; border: none; color: var(--ref-color-grey-60);
            cursor: pointer; padding: 0;
            font-size: var(--ref-font-size-sm);
            line-height: var(--ref-font-line-height-sm);
        }
        .collab-modal-footer {
            display: flex; justify-content: flex-end; gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xs) var(--ref-spacing-sm);
            border-top: 1px solid var(--sys-border-color-default);
            border-radius: 0 0 var(--ref-radius-xl) var(--ref-radius-xl);
            flex-shrink: 0;
        }
    `],
})
export class ComposePanelComponent {
    state = inject(ComposeStateService);
    private el = inject(ElementRef);
    @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('replaceInput') private replaceInput!: ElementRef<HTMLInputElement>;

    activeTab = signal<'base' | 'customized'>('base');
    baseTextFocused = signal(false);
    baseEditorExpanded = signal(false);
    focusedEditorId = signal<string | null>(null);
    flashingId = signal<string | null>(null);
    mediaExpanded = signal(this.state.mediaItems().length === 0);
    isDraggingOver = signal(false);
    showUploadPicker = signal(false);
    mediaMenuOpenId = signal<number | null>(null);
    replaceTargetId = signal<number | null>(null);
    readonly googleDriveConnected = false;
    readonly canvaConnected = false;
    customizationsExpanded = signal(true);
    fbOptionsExpanded = signal(true);
    igOptionsExpanded = signal(true);
    liOptionsExpanded = signal(true);
    xOptionsExpanded = signal(true);
    ttOptionsExpanded = signal(true);
    ytOptionsExpanded = signal(true);

    fbPostType = signal<'post' | 'reel' | 'story'>('post');
    igPostType = signal<'post' | 'reel' | 'story'>('post');
    fbTabIndex = computed(() => (['post', 'reel', 'story'] as const).indexOf(this.fbPostType()));
    igTabIndex = computed(() => (['post', 'reel', 'story'] as const).indexOf(this.igPostType()));

    // Tag users modal
    tagModalOpen = signal(false);
    tagModalTags = signal<TaggedUser[]>([]);
    savedTags = signal<TaggedUser[]>([]);
    pendingPin = signal<{ x: number; y: number } | null>(null);
    tagSearchQuery = signal('');

    tagUsersLabel = computed(() => {
        const n = this.savedTags().length;
        return n > 0 ? `Tag users · ${n}` : 'Tag users';
    });

    tagModalImage = computed(() =>
        this.state.mediaItems().find(m => m.type === 'image') ?? null
    );

    tagSuggestions = computed(() => {
        const q = this.tagSearchQuery().toLowerCase();
        const all = ['sarah_design', 'john_marketing', 'alex_creative', 'maya_social', 'lucas_brand'];
        return q ? all.filter(u => u.includes(q)).slice(0, 5) : all.slice(0, 5);
    });

    // Invite Collaborators modal
    collabModalOpen = signal(false);
    collabSearchQuery = signal('');
    collabPending = signal<CollabUser[]>([]);

    collabSuggestions = computed(() => {
        const q = this.collabSearchQuery().toLowerCase();
        if (!q) return [];
        const selected = this.collabPending().map(u => u.handle);
        return COLLAB_MOCK_USERS.filter(u =>
            (u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
            && !selected.includes(u.handle)
        ).slice(0, 6);
    });

    collabLabel = computed(() => {
        const n = this.state.collaborators().length;
        return n > 0 ? `Invite Collaborators (${n})` : 'Invite Collaborators';
    });

    setFbPostType(i: number): void { this.fbPostType.set((['post', 'reel', 'story'] as const)[i]); }
    setIgPostType(i: number): void { this.igPostType.set((['post', 'reel', 'story'] as const)[i]); }

    openTagModal(): void {
        this.tagModalTags.set([...this.savedTags()]);
        this.pendingPin.set(null);
        this.tagSearchQuery.set('');
        this.tagModalOpen.set(true);
    }

    closeTagModal(): void {
        this.tagModalOpen.set(false);
        this.pendingPin.set(null);
    }

    saveTagModal(): void {
        this.savedTags.set(this.tagModalTags());
        this.closeTagModal();
    }

    onTagImageClick(event: MouseEvent): void {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        this.pendingPin.set({ x, y });
        this.tagSearchQuery.set('');
    }

    selectTagSuggestion(username: string): void {
        const pin = this.pendingPin();
        if (!pin) return;
        const tag: TaggedUser = { id: crypto.randomUUID(), x: pin.x, y: pin.y, username };
        this.tagModalTags.update(tags => [...tags, tag]);
        this.pendingPin.set(null);
        this.tagSearchQuery.set('');
    }

    removeTag(id: string): void {
        this.tagModalTags.update(tags => tags.filter(t => t.id !== id));
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.tagModalOpen()) this.closeTagModal();
        if (this.collabModalOpen()) this.closeCollabModal();
    }

    openCollabModal(): void {
        this.collabPending.set([...this.state.collaborators()]);
        this.collabSearchQuery.set('');
        this.collabModalOpen.set(true);
    }

    closeCollabModal(): void {
        this.collabModalOpen.set(false);
        this.collabSearchQuery.set('');
    }

    confirmCollabModal(): void {
        this.state.collaborators.set(this.collabPending());
        this.closeCollabModal();
    }

    selectCollaborator(user: CollabUser): void {
        if (this.collabPending().length >= 3) return;
        this.collabPending.update(list => [...list, user]);
        this.collabSearchQuery.set('');
    }

    removeCollaborator(handle: string): void {
        this.collabPending.update(list => list.filter(u => u.handle !== handle));
    }

    fbWarning = computed(() => { const r = this.state.fbCharsRemaining(); return r < 1000 && r >= 0; });
    fbDanger = computed(() => this.state.fbCharsRemaining() < 0);

    constructor() {
        effect(() => {
            const targetId = this.state.focusedCustomizationId();
            if (!targetId) return;

            this.activeTab.set('customized');
            this.customizationsExpanded.set(true);

            setTimeout(() => {
                const card = this.el.nativeElement.querySelector(`[data-custom-id="${targetId}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    this.flashingId.set(targetId);
                    setTimeout(() => this.flashingId.set(null), 1500);
                }
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

    networkCharLimit(network: string): number {
        const limits: Record<string, number> = { facebook: 10000, linkedin: 3000, instagram: 2200, twitter: 280, youtube: 5000, tiktok: 2200 };
        return limits[network] ?? 10000;
    }

    networkSymbol(network: string): string {
        const map: Record<string, string> = { twitter: 'x-official', tiktok: 'tiktok-official' };
        return map[network] ?? network;
    }

    /** Returns true if the custom text for this profile exceeds its network's character limit. */
    customHasError(profileId: string, text: string): boolean {
        return text.length > this.networkCharLimit(this.profileNetwork(profileId));
    }

    isNearLimit(profileId: string, text: string): boolean {
        const limit = this.networkCharLimit(this.profileNetwork(profileId));
        const remaining = limit - text.length;
        return remaining >= 0 && remaining < limit * 0.1; // within 10% of limit
    }

    charCountColor(profileId: string, text: string): string {
        if (this.customHasError(profileId, text)) return 'red';
        if (this.isNearLimit(profileId, text)) return 'orange';
        return this.profileNetwork(profileId);
    }

    isLandscape(item: { width: number; height: number }): boolean {
        return item.width / item.height > 1.1;
    }

    networkHeaderBg(network: string): string {
        const tints: Record<string, string> = {
            facebook:  'rgba(24,  119, 242, 0.06)',
            instagram: 'rgba(225,  48,  108, 0.06)',
            linkedin:  'rgba(10,  102, 194, 0.06)',
            twitter:   'rgba(0,     0,   0, 0.04)',
            youtube:   'rgba(255,   0,   0, 0.05)',
            tiktok:    'rgba(0,     0,   0, 0.04)',
        };
        return tints[network] ?? 'var(--ref-color-grey-05)';
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

    addCustomMedia(profileId: string): void {
        const custom = this.state.getCustomization(profileId);
        const idx = (custom?.mediaItems.length ?? 0) % this.extraMedia.length;
        const m = this.extraMedia[idx];
        this.state.addCustomizationMedia(profileId, { id: Date.now(), ...m });
    }

    removeMedia(id: number): void {
        this.state.removeMediaItem(id);
        this.mediaMenuOpenId.set(null);
    }

    toggleUploadPicker(): void {
        this.showUploadPicker.update(v => !v);
    }

    pickFromComputer(): void {
        this.showUploadPicker.set(false);
        this.fileInput.nativeElement.click();
    }

    openLibrary(): void {
        this.showUploadPicker.set(false);
        // Library picker integration — stub
    }

    openGoogleDrive(): void {
        if (!this.googleDriveConnected) return;
        this.showUploadPicker.set(false);
    }

    openCanva(): void {
        if (!this.canvaConnected) return;
        this.showUploadPicker.set(false);
    }

    onFilesSelected(event: Event): void {
        const files = (event.target as HTMLInputElement).files;
        if (!files) return;
        Array.from(files).forEach(f => this.processFile(f));
        (event.target as HTMLInputElement).value = '';
        this.mediaExpanded.set(true);
    }

    onReplaceSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        const targetId = this.replaceTargetId();
        if (!file || targetId === null) return;
        this.state.removeMediaItem(targetId);
        this.processFile(file);
        this.replaceTargetId.set(null);
        (event.target as HTMLInputElement).value = '';
    }

    private processFile(file: File): void {
        const url = URL.createObjectURL(file);
        const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
        if (type === 'image') {
            const img = new Image();
            img.onload = () => {
                this.state.addMediaItem({ id: Date.now(), url, type, width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = url;
        } else {
            this.state.addMediaItem({ id: Date.now(), url, type, width: 1920, height: 1080 });
        }
    }

    toggleMediaMenu(id: number): void {
        this.mediaMenuOpenId.update(v => v === id ? null : id);
    }

    replaceMedia(id: number): void {
        this.replaceTargetId.set(id);
        this.mediaMenuOpenId.set(null);
        this.replaceInput.nativeElement.click();
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        this.isDraggingOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingOver.set(false);
        this.showUploadPicker.set(false);
        const files = event.dataTransfer?.files;
        if (!files) return;
        Array.from(files)
            .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
            .forEach(f => this.processFile(f));
        this.mediaExpanded.set(true);
    }
}
