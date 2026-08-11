import { ButtonComponent } from '@agorapulse/ui-components/button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { ToggleComponent } from '@agorapulse/ui-components/toggle';
import { TabsComponent, TabComponent } from '@agorapulse/ui-components/tabs';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { ActionDropdownComponent, ActionDropdownTriggerDirective, ActionDropdownItem } from '@agorapulse/ui-components/action-dropdown';
import { AutosizeTextareaDirective } from '@agorapulse/ui-components/directives';
import { InputDirective } from '@agorapulse/ui-components/input';
import { ModalComponent } from '@agorapulse/ui-components/modal';
import { MatDialog } from '@angular/material/dialog';
import { CollabModalComponent } from './collab-modal.component';
import { TagModalComponent } from './tag-modal.component';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import {
    ChangeDetectionStrategy, Component, computed, effect,
    ElementRef, inject, signal, ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SegmentedControlComponent, SegmentedControlOption } from '@agorapulse/ui-components/segmented-control';
import { ComposeStateService, Customization, MediaItem } from '../compose-state';

interface TaggedUser { id: string; x: number; y: number; username: string; }

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-compose-panel',
    imports: [ButtonComponent, IconButtonComponent, ToggleComponent, TabsComponent, TabComponent, AvatarComponent, ActionDropdownComponent, ActionDropdownTriggerDirective, AutosizeTextareaDirective, InputDirective, TooltipDirective, SymbolComponent, FormsModule, DecimalPipe, SegmentedControlComponent],
    template: `
        <main class="compose-panel" [class.is-draft]="state.isDraft()">
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
                <h3 class="section-heading">Compose your post</h3>

                <!-- ── Base post ─────────────────────────────────────────── -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <ap-symbol symbolId="star" size="xs" color="blood-orange"></ap-symbol>
                            <h4>Base post</h4>
                        </div>
                        <span class="section-hint">Shared across all unless customized</span>
                    </div>
                    <div class="text-editor" [class.focused]="baseTextFocused()">
                        <textarea
                            apAutosize
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
                                <ap-button [config]="{ style: 'mermaid' }" symbolId="sparkles" symbolPosition="left">Writing Assistant</ap-button>
                                </div>
                        </div>
                        <div class="editor-footer">
                            <div class="char-counts">
                                @if (state.facebookProfiles().length > 0) {
                                    <span class="ap-textarea-counter" [class.warning]="fbWarning()" [class.error]="fbDanger()" [apTooltip]="'Facebook — ' + (state.fbCharsRemaining() | number) + ' chars remaining (limit 10,000)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="facebook" size="xs" [color]="fbDanger() ? 'red' : fbWarning() ? 'orange' : 'facebook'"></ap-symbol>
                                        {{ state.fbCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.linkedinProfiles().length > 0) {
                                    <span class="ap-textarea-counter" [class.error]="state.liCharsRemaining() < 0" [apTooltip]="'LinkedIn — ' + (state.liCharsRemaining() | number) + ' chars remaining (limit 3,000)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="linkedin" size="xs" [color]="state.liCharsRemaining() < 0 ? 'red' : 'linkedin'"></ap-symbol>
                                        {{ state.liCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.instagramProfiles().length > 0) {
                                    <span class="ap-textarea-counter" [class.error]="state.igCharsRemaining() < 0" [apTooltip]="'Instagram — ' + (state.igCharsRemaining() | number) + ' chars remaining (limit 2,200)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="instagram" size="xs" [color]="state.igCharsRemaining() < 0 ? 'red' : 'instagram'"></ap-symbol>
                                        {{ state.igCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.twitterProfiles().length > 0) {
                                    <span class="ap-textarea-counter" [class.error]="state.twitterCharsRemaining() < 0" [apTooltip]="'X (Twitter) — ' + (state.twitterCharsRemaining() | number) + ' chars remaining (limit 280)'" apTooltipPosition="top" [apTooltipShowDelay]="400">
                                        <ap-symbol symbolId="x-official" size="xs" [color]="state.twitterCharsRemaining() < 0 ? 'red' : 'twitter'"></ap-symbol>
                                        {{ state.twitterCharsRemaining() | number }}
                                    </span>
                                }
                                @if (state.selectedProfiles().length === 0) {
                                    <span class="ap-textarea-counter grey" [apTooltip]="'Characters remaining'" apTooltipPosition="top" [apTooltipShowDelay]="400">
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
                  <div class="ap-accordion" [class.collapsed]="!mediaExpanded()">
                    <button type="button" class="ap-accordion-header" [attr.aria-expanded]="mediaExpanded()" (click)="mediaExpanded.set(!mediaExpanded())">
                        <h4 class="ap-accordion-title">
                            Media
                            @if (!mediaExpanded() && state.mediaItems().length > 0) {
                                <span class="section-count">({{ state.mediaItems().length }})</span>
                            }
                        </h4>
                        <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                    </button>
                    @if (mediaExpanded()) {
                        <div class="ap-accordion-content media-drop-zone"
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
                                <button class="add-media-btn" [apActionDropdownTrigger]="uploadMenu">
                                    <ap-symbol symbolId="plus" size="sm" color="basic-grey"></ap-symbol>
                                </button>
                                <ap-action-dropdown #uploadMenu [items]="uploadMenuItems" (itemClick)="onUploadMenuAction($event)"></ap-action-dropdown>
                                @for (item of state.mediaItems(); track item.id) {
                                    <div class="media-thumb">
                                        <img [src]="item.url" alt="Media" />
                                        <div class="media-overlay">
                                            <ap-icon-button class="media-overlay-btn" [apActionDropdownTrigger]="mediaMenu" type="flat" symbolId="more" ariaLabel="Media options"></ap-icon-button>
                                            <ap-action-dropdown #mediaMenu [items]="mediaMenuItems" (itemClick)="onMediaMenuAction(item.id, $event)"></ap-action-dropdown>
                                            <ap-icon-button class="media-overlay-btn" type="flat" symbolId="trash" ariaLabel="Remove media" (onClick)="removeMedia(item.id)"></ap-icon-button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                  </div>
                </div>

                <!-- ── Network options ────────────────────────────────────── -->
                <div class="section last">
                    <div class="section-header">
                        <span class="collapsible-title">Network options</span>
                    </div>
                    <p class="network-hint">Defaults applied to all profiles per network. Customize a profile to change it individually.</p>

                    <!-- Facebook -->
                    @if (state.facebookProfiles().length > 0) {
                        <div class="ap-accordion network-card" [class.collapsed]="!fbOptionsExpanded()">
                            <button type="button" class="ap-accordion-header" [attr.aria-expanded]="fbOptionsExpanded()" [style.background]="networkHeaderBg('facebook')" (click)="fbOptionsExpanded.set(!fbOptionsExpanded())">
                                <ap-symbol symbolId="facebook" size="sm" color="facebook"></ap-symbol>
                                    <h4 class="ap-accordion-title">Facebook options</h4>
                                <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                            </button>
                            @if (fbOptionsExpanded()) {
                                <div class="network-card-content">
                                    <ap-segmented-control [options]="postTypeOptions" [value]="fbPostType()" (valueChange)="setFbPostType($event)"></ap-segmented-control>
                                    <div class="field-group">
                                        <label class="field-label">Video title</label>
                                        <div class="field-textarea-wrap">
                                            <textarea class="field-textarea" [value]="state.fbVideoTitle()" (input)="state.fbVideoTitle.set(asTextarea($event))" placeholder="This is the title of the video" rows="3"></textarea>
                                            <div class="field-textarea-footer">
                                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat"></ap-icon-button>
                                                <ap-button [config]="{ style: 'mermaid' }" symbolId="sparkles" symbolPosition="left">Writing Assistant</ap-button>
                                            </div>
                                        </div>
                                        <div class="char-counts" style="padding: var(--ref-spacing-xxxs) 0 0;">
                                            <span class="ap-textarea-counter"><ap-symbol symbolId="facebook" size="xs" color="facebook"></ap-symbol> {{ state.fbCharsRemaining() | number }}</span>
                                        </div>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Boost this post</span><span class="option-hint">Text about what is post boosting</span></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="ad" symbolPosition="left">Boost Post</ap-button>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                        <ap-toggle name="fbFirstComment" [checked]="state.fbFirstComment()" (change)="state.fbFirstComment.set($event)"></ap-toggle>
                                    </div>
                                    @if (state.fbFirstComment()) {
                                        <div class="first-comment-editor ap-textarea-field">
                                            <textarea [value]="state.fbFirstCommentText()" (input)="state.fbFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <!-- Instagram -->
                    @if (state.instagramProfiles().length > 0) {
                        <div class="ap-accordion network-card" [class.collapsed]="!igOptionsExpanded()">
                            <button type="button" class="ap-accordion-header" [attr.aria-expanded]="igOptionsExpanded()" [style.background]="networkHeaderBg('instagram')" (click)="igOptionsExpanded.set(!igOptionsExpanded())">
                                <ap-symbol symbolId="instagram" size="sm" color="instagram"></ap-symbol>
                                    <h4 class="ap-accordion-title">Instagram options</h4>
                                <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                            </button>
                            @if (igOptionsExpanded()) {
                                <div class="network-card-content">
                                    <ap-segmented-control [options]="postTypeOptions" [value]="igPostType()" (valueChange)="setIgPostType($event)"></ap-segmented-control>
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
                                            <div class="first-comment-editor ap-textarea-field">
                                                <textarea [value]="state.igFirstCommentText()" (input)="state.igFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                            </div>
                                        }
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">PulseLink in Bio</span><span class="option-hint">Add a link to your content on your PulseLink</span></div>
                                            <ap-toggle name="igPulseLink" [checked]="state.igPulseLink()" (change)="state.igPulseLink.set($event)"></ap-toggle>
                                        </div>
                                        @if (igPostType() === 'post') {
                                            <div class="option-row action-row">
                                                <div class="option-info-row"><ap-symbol symbolId="user" size="md" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag users</span><span class="option-hint">No users</span></div></div>
                                                <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="user--plus" symbolPosition="left" (click)="openTagModal()">{{ tagUsersLabel() }}</ap-button>
                                            </div>
                                        }
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="md" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Invite collaborator(s)</span><span class="option-hint">No collaborator(s)</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="user--plus" symbolPosition="left" (click)="openCollabModal()">{{ collabLabel() }}</ap-button>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="product-tag" size="md" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag products</span><span class="option-hint">No products</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="product-tag" symbolPosition="left">Tag products</ap-button>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <!-- LinkedIn -->
                    @if (state.linkedinProfiles().length > 0) {
                        <div class="ap-accordion network-card" [class.collapsed]="!liOptionsExpanded()">
                            <button type="button" class="ap-accordion-header" [attr.aria-expanded]="liOptionsExpanded()" [style.background]="networkHeaderBg('linkedin')" (click)="liOptionsExpanded.set(!liOptionsExpanded())">
                                <ap-symbol symbolId="linkedin" size="sm" color="linkedin"></ap-symbol><h4 class="ap-accordion-title">LinkedIn options</h4>
                                <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                            </button>
                            @if (liOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                        <ap-toggle name="liFirstComment" [checked]="state.liFirstComment()" (change)="state.liFirstComment.set($event)"></ap-toggle>
                                    </div>
                                    @if (state.liFirstComment()) {
                                        <div class="first-comment-editor ap-textarea-field">
                                            <textarea [value]="state.liFirstCommentText()" (input)="state.liFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                        </div>
                                    }
                                    <div class="option-section-title">Target audience settings</div>
                                    <div class="option-section-desc">Define the audience to display your post to</div>
                                    <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" symbolId="plus" symbolPosition="left">Add industry</ap-button>
                                    <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" symbolId="plus" symbolPosition="left">Add job function</ap-button>
                                    <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" symbolId="plus" symbolPosition="left">Add seniority</ap-button>
                                </div>
                            }
                        </div>
                    }

                    <!-- X (Twitter) -->
                    @if (state.twitterProfiles().length > 0) {
                        <div class="ap-accordion network-card" [class.collapsed]="!xOptionsExpanded()">
                            <button type="button" class="ap-accordion-header" [attr.aria-expanded]="xOptionsExpanded()" [style.background]="networkHeaderBg('twitter')" (click)="xOptionsExpanded.set(!xOptionsExpanded())">
                                <ap-symbol symbolId="x-official" size="sm" color="twitter"></ap-symbol><h4 class="ap-accordion-title">X (Twitter) options</h4>
                                <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                            </button>
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
                        <div class="ap-accordion network-card" [class.collapsed]="!ttOptionsExpanded()">
                            <button type="button" class="ap-accordion-header" [attr.aria-expanded]="ttOptionsExpanded()" [style.background]="networkHeaderBg('tiktok')" (click)="ttOptionsExpanded.set(!ttOptionsExpanded())">
                                <ap-symbol symbolId="tiktok-official" size="sm" color="tiktok"></ap-symbol><h4 class="ap-accordion-title">TikTok options</h4>
                                <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                            </button>
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
                        <div class="ap-accordion network-card" [class.collapsed]="!ytOptionsExpanded()">
                            <button type="button" class="ap-accordion-header" [attr.aria-expanded]="ytOptionsExpanded()" [style.background]="networkHeaderBg('youtube')" (click)="ytOptionsExpanded.set(!ytOptionsExpanded())">
                                <ap-symbol symbolId="youtube" size="sm" color="youtube"></ap-symbol><h4 class="ap-accordion-title">YouTube options</h4>
                                <ap-symbol class="ap-accordion-toggle" symbolId="chevron-up" size="xs" color="basic-grey"></ap-symbol>
                            </button>
                            @if (ytOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="field-group">
                                        <label class="field-label">Video title <span class="required-star">*</span></label>
                                        <div class="field-textarea-wrap">
                                            <textarea class="field-textarea" [value]="state.ytTitle()" (input)="state.ytTitle.set(asTextarea($event))" placeholder="Write a description with text, links..." rows="3"></textarea>
                                            <div class="field-textarea-footer">
                                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat"></ap-icon-button>
                                                <ap-button [config]="{ style: 'mermaid' }" symbolId="sparkles" symbolPosition="left">Writing Assistant</ap-button>
                                            </div>
                                        </div>
                                        <div class="char-counts" style="padding: var(--ref-spacing-xxxs) 0 0;">
                                            <span class="ap-textarea-counter" [class.error]="state.ytTitle().length > 280"><ap-symbol symbolId="youtube" size="xs" [color]="state.ytTitle().length > 280 ? 'red' : 'youtube'"></ap-symbol> {{ 280 - state.ytTitle().length }}</span>
                                        </div>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Privacy status</span></div>
                                        <ap-segmented-control
                                            [options]="[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]"
                                            [value]="state.ytPrivacy()"
                                            (valueChange)="state.ytPrivacy.set($event === 'private' ? 'private' : 'public')">
                                        </ap-segmented-control>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">Category</label>
                                        <select class="ap-native-select"><option value="" disabled selected>Select Category</option></select>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">Playlist</label>
                                        <select class="ap-native-select"><option value="" disabled selected>Select a playlist</option></select>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">YouTube Video tags <span class="optional-label">(optional)</span></label>
                                        <input apInput class="full-width" name="ytVideoTags" placeholder="Type your video tags" />
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">License <span class="optional-label">(optional)</span></label>
                                        <select class="ap-native-select"><option value="" disabled selected>Select a license</option></select>
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
                                Click <strong>Customize</strong> on any preview card to write a different post for that profile.
                            </p>
                        } @else {
                            <p class="customizations-hint">Each card below replaces the base post for that profile.</p>
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
                                           
                                            [apTooltip]="'Reset to base post content'"
                                            apTooltipPosition="bottom"
                                            [apTooltipShowDelay]="400"
                                            (onClick)="state.resetCustomization(custom.profileId)">
                                        </ap-icon-button>
                                        <ap-icon-button
                                            symbolId="close"
                                            ariaLabel="Remove customization"
                                            type="flat"
                                           
                                            [apTooltip]="'Remove this customization'"
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
                                    <span class="ap-textarea-counter"
                                        [class.error]="custom.text.length > networkCharLimit(profileNetwork(custom.profileId))"
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
                                                    <ap-icon-button class="media-overlay-btn" type="flat" symbolId="trash" color="red" ariaLabel="Remove media" (onClick)="state.removeCustomizationMedia(custom.profileId, item.id)"></ap-icon-button>
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
                                            <div class="first-comment-editor ap-textarea-field"><textarea [value]="custom.firstCommentText" (input)="onFirstCommentInput($event, custom.profileId)" placeholder="Write your first comment…" rows="2"></textarea></div>
                                        }
                                        <div class="option-row">
                                            <div class="option-info"><span class="option-label">Boost this post</span><span class="option-hint">Text about what is post boosting</span></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="ad" symbolPosition="left">Boost Post</ap-button>
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
                                            <div class="first-comment-editor ap-textarea-field"><textarea [value]="custom.firstCommentText" (input)="onFirstCommentInput($event, custom.profileId)" placeholder="Write your first comment…" rows="2"></textarea></div>
                                        }
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">PulseLink in Bio</span><span class="option-hint">Add a link to your content on your PulseLink</span></div>
                                            <ap-toggle name="igPulseLink" [checked]="state.igPulseLink()" (change)="state.igPulseLink.set($event)"></ap-toggle>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="md" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag users</span><span class="option-hint">No users</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="user--plus" symbolPosition="left" (click)="openTagModal()">{{ tagUsersLabel() }}</ap-button>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="md" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Invite collaborator(s)</span><span class="option-hint">No collaborator(s)</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="user--plus" symbolPosition="left" (click)="openCollabModal()">{{ collabLabel() }}</ap-button>
                                        </div>
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="product-tag" size="md" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag products</span><span class="option-hint">No products</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" symbolId="product-tag" symbolPosition="left">Tag products</ap-button>
                                        </div>
                                    }
                                    @case ('linkedin') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">First comment</span><span class="option-hint">Publish a first comment with your post</span></div>
                                            <ap-toggle name="firstComment" [checked]="custom.firstComment" (change)="state.updateCustomizationFirstComment(custom.profileId, $event)"></ap-toggle>
                                        </div>
                                        @if (custom.firstComment) {
                                            <div class="first-comment-editor ap-textarea-field"><textarea [value]="custom.firstCommentText" (input)="onFirstCommentInput($event, custom.profileId)" placeholder="Write your first comment…" rows="2"></textarea></div>
                                        }
                                        <div class="option-section-title">Target audience settings</div>
                                        <div class="option-section-desc">Define the audience to display your post to</div>
                                        <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" symbolId="plus" symbolPosition="left">Add industry</ap-button>
                                        <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" symbolId="plus" symbolPosition="left">Add job function</ap-button>
                                        <ap-button class="audience-btn" [config]="{style:'stroked',color:'grey'}" symbolId="plus" symbolPosition="left">Add seniority</ap-button>
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
        </main>


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
        }
        .draft-toggle-tab {
            flex-shrink: 0; margin-left: auto; display: flex; align-items: center; gap: var(--ref-spacing-xxs);
            cursor: pointer; padding: 0 var(--ref-spacing-sm) 0 var(--ref-spacing-xxs); border-radius: var(--sys-border-radius-md);
            transition: background 0.15s;
        }
        .draft-toggle-label {
            font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight);
            color: var(--sys-text-color-light);
            transition: color 0.15s;
        }
        .draft-toggle-tab.is-on .draft-toggle-label {
            color: var(--ref-color-yellow-150);
        }
        .section-heading {
            padding: var(--ref-spacing-sm) 0 var(--ref-spacing-xs); font-size: var(--sys-text-style-h3-size); font-weight: var(--sys-text-style-h3-weight); line-height: var(--sys-text-style-h3-line-height);
            color: var(--sys-text-color-default);
        }
        .compose-content { flex: 1; min-height: 0; overflow-y: auto; padding: 0 var(--ref-spacing-sm) var(--ref-spacing-md); background: var(--ref-color-white); }
        .section { padding: var(--ref-spacing-sm) 0; max-width: 640px; margin: 0 auto; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--ref-spacing-xxxs); }
        .section-title { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); font-size: var(--sys-text-style-h4-size); font-weight: var(--sys-text-style-h4-weight); line-height: var(--sys-text-style-h4-line-height); color: var(--sys-text-color-default); }
        .section-hint { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); }

        .text-editor {
            border: 1px solid var(--comp-input-border-default-color); border-radius: var(--comp-input-border-radius); overflow: hidden;
            background: var(--comp-input-fill-color); transition: border-color 0.15s;
            &.inner { border-radius: var(--comp-input-border-radius); margin: 8px 0; }
            &:hover:not(.focused) { border-color: var(--comp-input-border-hover-color); }
            &.focused { border-color: var(--comp-input-border-focused-color); }
            /* apAutosize grows the field with its content; 96px is just the floor. */
            textarea { min-height: 96px; }
        }
        .post-textarea {
            width: 100%; padding: var(--ref-spacing-xxs) var(--comp-input-padding-horizontal); border: none; outline: none; resize: none;
            font-size: var(--comp-input-text-size); color: var(--comp-input-text-default-color);
            font-family: var(--comp-input-text-font-family); font-weight: var(--comp-input-text-font-weight);
            background: transparent; line-height: var(--comp-input-text-line-height);
            box-sizing: border-box;
            &::placeholder { color: var(--comp-input-text-placeholder-color); }
        }
        .editor-toolbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxxs) var(--ref-spacing-xxs); border-top: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-white);
        }
        .toolbar-icons { display: flex; }
        .toolbar-right { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); }
        .editor-footer {
            display: flex; align-items: center;
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs); border-top: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-grey-05);
        }
        /* Per-network counters. Typography + warning/error colours come from the DS
           .ap-textarea-counter class (css-ui/_textarea); we only add the row layout
           and the network icon, which that class does not cover. */
        .char-counts { display: flex; gap: var(--ref-spacing-xs); &.inner { padding: var(--ref-spacing-xxxs) var(--ref-spacing-xs) var(--ref-spacing-xxs); } }
        .ap-textarea-counter {
            display: flex; align-items: center; gap: var(--ref-spacing-xxxs);
            /* Scoped with :not() so the DS .warning / .error modifiers keep winning —
               a bare color declaration here ties their specificity and, being a
               component style, would be injected last and override them. */
            /* Was electric-blue-100 = 3.07:1 on grey-05, under AA. Colour now only signals. */
            &:not(.warning):not(.error) { color: var(--sys-text-color-light); }
            &.grey { color: var(--sys-text-color-light); }
        }

        .collapsible-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxs) 0 var(--ref-spacing-xs); cursor: pointer; user-select: none;
        }
        .collapsible-title { display: flex; align-items: center; gap: var(--ref-spacing-xxs); font-size: var(--sys-text-style-h4-size); font-weight: var(--sys-text-style-h4-weight); line-height: var(--sys-text-style-h4-line-height); color: var(--sys-text-color-default); }
        .section-count { font-size: var(--sys-text-style-caption-size); font-weight: var(--sys-text-style-caption-weight); color: var(--sys-text-color-light); }

        .media-grid { display: flex; gap: var(--ref-spacing-xxs); flex-wrap: wrap; &.inner { padding: 0 12px 8px; } }
        .add-media-btn {
            width: 96px; height: 96px; border: 2px dashed var(--ref-color-grey-40);
            border-radius: var(--sys-border-radius-md); background: transparent; cursor: pointer;
            display: flex; align-items: center; justify-content: center; transition: all 0.15s;
            &:hover { background: var(--ref-color-grey-05); border-color: var(--ref-color-electric-blue-60); }
        }
        .media-thumb {
            position: relative; width: 96px; height: 96px; border-radius: var(--sys-border-radius-md); overflow: hidden;
            img { width: 100%; height: 100%; object-fit: cover; display: block; }
            /* The scrim lives on the container so the DS Icon Buttons keep their own
               size and styling (previously forced to 24px + white via ::ng-deep). */
            .media-overlay {
                position: absolute; top: 0; right: 0; display: flex; gap: var(--ref-spacing-xxxs);
                padding: var(--ref-spacing-xxxs);
                border-bottom-left-radius: var(--sys-border-radius-md);
                background: var(--ref-color-white);
                opacity: 0; transition: opacity 0.15s;
            }
            &:hover .media-overlay, &:focus-within .media-overlay { opacity: 1; }
            /* Touch and narrow viewports have no hover at all. */
            @media (hover: none), (max-width: 1024px) {
                .media-overlay { opacity: 1; }
            }
        }

        /* Drag & drop zone */
        /* Doubles as .ap-accordion-content, so the DS owns padding + gap. */
        .media-drop-zone {
            position: relative;
            transition: background 0.15s, border-color 0.15s;
            &.drag-over {
                background: var(--ref-color-electric-blue-05);
                outline: 2px dashed var(--ref-color-electric-blue-60);
            }
        }
        .drop-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: var(--ref-spacing-xxs); background: var(--ref-color-electric-blue-05);
            border-radius: var(--sys-border-radius-lg); pointer-events: none;
            font-size: var(--sys-text-style-body-bold-size); font-weight: var(--sys-text-style-body-bold-weight); color: var(--ref-color-electric-blue-100);
        }

        /* Customizations section hint */
        .customizations-hint { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); margin: 0 0 var(--ref-spacing-xxs); }

        /* Customization cards */
        .custom-card {
            border: 1px solid var(--sys-border-color-default);
            border-radius: var(--sys-border-radius-md);
            overflow: hidden; margin-bottom: var(--ref-spacing-xxs); background: var(--ref-color-white);
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
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs); background: var(--ref-color-grey-05);
            border-bottom: 1px solid var(--sys-border-color-default);
            transition: background 0.15s;
        }
        .profile-row { display: flex; align-items: center; gap: var(--ref-spacing-xxs); }
        .profile-label { font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight); color: var(--sys-text-color-default); }
        .row-gap { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); }
        .inner-pad { padding: var(--ref-spacing-xxs) var(--ref-spacing-xs); }

        .option-row {
            display: flex; align-items: flex-start; justify-content: space-between;
            padding: var(--ref-spacing-sm) var(--ref-spacing-xs); border-top: 1px solid var(--sys-border-color-default); gap: var(--ref-spacing-sm);
            &.toggle-row { align-items: center; }
            &.action-row { align-items: center; }
        }
        .option-info { display: flex; flex-direction: column; gap: var(--ref-spacing-xxxs); flex: 1; }
        .option-info-row { display: flex; align-items: center; gap: var(--ref-spacing-xs); flex: 1; }
        .option-label { font-size: var(--sys-text-style-body-size); font-weight: var(--sys-text-style-body-weight); line-height: var(--sys-text-style-body-line-height); color: var(--sys-text-color-default); }
        .option-hint { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); line-height: var(--sys-text-style-caption-line-height); }

        /* Padded band around a DS .ap-textarea-field (css-ui). The min-width is relaxed
           so the field can shrink inside a customization card. */
        .first-comment-editor {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs) var(--ref-spacing-xs);
            border-top: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-grey-bg);
            > textarea { min-width: 0; }
        }

        .network-hint { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); margin: 0 0 var(--ref-spacing-xxs); line-height: var(--sys-text-style-caption-line-height); }
        /* Shell, border, radius and collapse come from the DS .ap-accordion; only the
           outer rhythm and the full-bleed body are ours. */
        .network-card { margin-top: var(--ref-spacing-xs); overflow: hidden; }
        /* The DS header is a <button> here so it is reachable and announces state. */
        button.ap-accordion-header {
            width: 100%; text-align: left; cursor: pointer;
            border: none; font-family: var(--ref-font-family);
            &:focus-visible { outline: 2px solid var(--ref-color-electric-blue-60); outline-offset: -2px; }
        }
        .network-card-content { padding: 0 0 var(--ref-spacing-xs); }
        .network-card-content > ap-segmented-control { display: block; padding: var(--ref-spacing-sm) var(--ref-spacing-sm) 0; }
        .ap-accordion-header .ap-accordion-title { font-size: var(--sys-text-style-body-bold-size); font-weight: var(--sys-text-style-body-bold-weight); color: var(--sys-text-color-default); }
        .field-group {
            padding: var(--ref-spacing-xs);
            .field-label { display: block; font-family: var(--comp-forms-label-font-family); font-size: var(--comp-forms-label-size); font-weight: var(--comp-forms-label-font-weight); line-height: var(--comp-forms-label-line-height); color: var(--comp-forms-label-text-color); margin-bottom: var(--comp-forms-label-spacing-vertical); }
            .field-textarea {
                width: 100%; padding: var(--ref-spacing-xxs) var(--comp-input-padding-horizontal); border: 1px solid var(--comp-input-border-default-color);
                border-radius: var(--comp-input-border-radius); font-size: var(--comp-input-text-size); color: var(--comp-input-text-default-color);
                font-family: var(--comp-input-text-font-family); font-weight: var(--comp-input-text-font-weight); line-height: var(--comp-input-text-line-height);
                resize: none; outline: none;
                background: var(--comp-input-fill-color); box-sizing: border-box;
                &::placeholder { color: var(--comp-input-text-placeholder-color); }
                &:hover:not(:focus) { border-color: var(--comp-input-border-hover-color); }
                &:focus { border-color: var(--comp-input-border-focused-color); }
            }
        }
        .empty-hint { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); margin: var(--ref-spacing-xxxs) 0 0; }

        /* Per-profile media override */
        .custom-media-section {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            border-top: 1px solid var(--sys-border-color-default);
        }
        .custom-media-header {
            display: flex; align-items: center; gap: var(--ref-spacing-xxs); margin-bottom: var(--ref-spacing-xxs);
        }
        .custom-media-label { font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight); color: var(--sys-text-color-default); }
        .custom-media-hint { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); }
        .add-media-btn.small { width: 48px; height: 48px; }
        .media-thumb.small { width: 48px; height: 48px; border-radius: var(--sys-border-radius-md); }

        /* ap-tabs inside network cards — collapse empty content area */

        /* LinkedIn audience targeting */
        .option-section-title {
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs) 0; font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight); line-height: var(--sys-text-style-caption-bold-line-height);
            color: var(--sys-text-color-default);
            border-top: 1px solid var(--sys-border-color-default);
        }
        .option-section-desc { padding: 0 var(--ref-spacing-xs) var(--ref-spacing-xxxs); font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); line-height: var(--sys-text-style-caption-line-height); }
        .audience-btn {
            display: block;
            width: fit-content;
            margin: var(--ref-spacing-xxs) var(--ref-spacing-xs) 0;
        }

        /* Textarea with footer toolbar (Facebook/YouTube video title) */
        .field-textarea-wrap { position: relative; }
        .field-textarea-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxxs); border-top: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-white);
        }

        /* Form fields for YouTube */
        .required-star { color: var(--ref-color-red-100); }
        .optional-label { color: var(--sys-text-color-light); font-weight: var(--sys-text-style-body-weight); }


    `],
})
export class ComposePanelComponent {
    state = inject(ComposeStateService);
    private readonly dialog = inject(MatDialog);
    private el = inject(ElementRef);
    @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('replaceInput') private replaceInput!: ElementRef<HTMLInputElement>;

    activeTab = signal<'base' | 'customized'>('base');
    baseTextFocused = signal(false);
    focusedEditorId = signal<string | null>(null);
    flashingId = signal<string | null>(null);
    mediaExpanded = signal(this.state.mediaItems().length === 0);
    isDraggingOver = signal(false);
    replaceTargetId = signal<number | null>(null);
    readonly googleDriveConnected = false;
    readonly canvaConnected = false;

    readonly uploadMenuItems: ActionDropdownItem[] = [
        { name: 'computer', label: 'From computer', startSymbolId: 'image' },
        { name: 'library', label: 'From Library', startSymbolId: 'folder' },
        { name: 'gdrive', label: 'Google Drive', startSymbolId: 'image', badgeLabel: this.googleDriveConnected ? undefined : 'Connect', disabled: !this.googleDriveConnected },
        { name: 'canva', label: 'Design with Canva', startSymbolId: 'pen', badgeLabel: this.canvaConnected ? undefined : 'Connect', disabled: !this.canvaConnected },
    ];
    readonly mediaMenuItems: ActionDropdownItem[] = [
        { name: 'replace', label: 'Replace', startSymbolId: 'refresh' },
        { name: 'remove', label: 'Remove', startSymbolId: 'trash', redModeEnabled: true },
    ];

    onUploadMenuAction(item: ActionDropdownItem): void {
        switch (item.name) {
            case 'computer': this.pickFromComputer(); break;
            case 'library': this.openLibrary(); break;
            case 'gdrive': this.openGoogleDrive(); break;
            case 'canva': this.openCanva(); break;
        }
    }

    onMediaMenuAction(id: number, item: ActionDropdownItem): void {
        if (item.name === 'replace') this.replaceMedia(id);
        else if (item.name === 'remove') this.removeMedia(id);
    }
    customizationsExpanded = signal(true);
    fbOptionsExpanded = signal(true);
    igOptionsExpanded = signal(true);
    liOptionsExpanded = signal(true);
    xOptionsExpanded = signal(true);
    ttOptionsExpanded = signal(true);
    ytOptionsExpanded = signal(true);

    fbPostType = signal<'post' | 'reel' | 'story'>('post');
    igPostType = signal<'post' | 'reel' | 'story'>('post');
    readonly postTypeOptions: SegmentedControlOption[] = [
        { value: 'post', label: 'Post' },
        { value: 'reel', label: 'Reel', symbolId: 'video' },
        { value: 'story', label: 'Story' },
    ];

    // Tag users modal
    savedTags = signal<TaggedUser[]>([]);

    tagUsersLabel = computed(() => {
        const n = this.savedTags().length;
        return n > 0 ? `Tag users · ${n}` : 'Tag users';
    });

    tagModalImage = computed(() =>
        this.state.mediaItems().find(m => m.type === 'image') ?? null
    );

    collabLabel = computed(() => {
        const n = this.state.collaborators().length;
        return n > 0 ? `Invite Collaborators (${n})` : 'Invite Collaborators';
    });

    setFbPostType(v: string): void { this.fbPostType.set(v as 'post' | 'reel' | 'story'); }
    setIgPostType(v: string): void { this.igPostType.set(v as 'post' | 'reel' | 'story'); }

    openTagModal(): void {
        ModalComponent.openDialog(
            this.dialog,
            { matDialogConfig: { data: { imageUrl: this.tagModalImage()?.url ?? null, tags: this.savedTags() } } },
            TagModalComponent,
        ).afterClosed().subscribe((result) => {
            if (result) this.savedTags.set(result);
        });
    }

    openCollabModal(): void {
        ModalComponent.openDialog(
            this.dialog,
            { matDialogConfig: { data: { collaborators: this.state.collaborators() } } },
            CollabModalComponent,
        ).afterClosed().subscribe((result) => {
            if (result) this.state.collaborators.set(result);
        });
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
            facebook:  'var(--ref-color-facebook-10)',
            instagram: 'var(--ref-color-instagram-10)',
            linkedin:  'var(--ref-color-linkedin-10)',
            twitter:   'var(--ref-color-twitter-10)',
            youtube:   'var(--ref-color-youtube-10)',
            tiktok:    'var(--ref-color-tiktok-default-10)',
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
    }

    pickFromComputer(): void {
        this.fileInput.nativeElement.click();
    }

    openLibrary(): void {
        // Library picker integration — stub
    }

    openGoogleDrive(): void {
        if (!this.googleDriveConnected) return;
        // Google Drive picker integration — stub
    }

    openCanva(): void {
        if (!this.canvaConnected) return;
        // Canva integration — stub
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

    replaceMedia(id: number): void {
        this.replaceTargetId.set(id);
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
        const files = event.dataTransfer?.files;
        if (!files) return;
        Array.from(files)
            .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
            .forEach(f => this.processFile(f));
        this.mediaExpanded.set(true);
    }
}
