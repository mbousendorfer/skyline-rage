import { ButtonComponent } from '@agorapulse/ui-components/button';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { SlideToggleComponent } from '@agorapulse/ui-components/slide-toggle';
import { TabsComponent, TabComponent } from '@agorapulse/ui-components/tabs';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
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
    imports: [ButtonComponent, IconButtonComponent, SlideToggleComponent, TabsComponent, TabComponent, AvatarComponent, TooltipDirective, SymbolComponent, FormsModule, DecimalPipe],
    template: `
        <div class="compose-panel">
            <!-- ── Tab navigation ──────────────────────────────────────── -->
            <div class="compose-tabs">
                <button class="tab-btn" [class.active]="activeTab() === 'base'" (click)="activeTab.set('base')">
                    Base post
                </button>
                <button class="tab-btn" [class.active]="activeTab() === 'customized'" (click)="activeTab.set('customized')">
                    Customized posts
                    @if (state.activeCustomizations().length > 0) {
                        <span class="tab-badge">{{ state.activeCustomizations().length }}</span>
                    }
                </button>
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
                                <ap-button class="writing-assistant-btn" [config]="{ style: 'stroked', color: 'blue' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                <button class="expand-btn" (click)="baseEditorExpanded.set(!baseEditorExpanded())" [apTooltip]="baseEditorExpanded() ? 'Collapse editor' : 'Expand editor'" apTooltipPosition="bottom" [apTooltipShowDelay]="400">
                                    <ap-symbol [symbolId]="baseEditorExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                                </button>
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
                                        <ap-symbol symbolId="x-twitter" size="xs" [color]="state.twitterCharsRemaining() < 0 ? 'red' : 'twitter'"></ap-symbol>
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
                                    <!-- Network compatibility indicators -->
                                    @if (isLandscape(item)) {
                                        <div class="media-network-issues">
                                            @if (state.facebookProfiles().length > 0) {
                                                <span class="net-badge warn" [apTooltip]="'Facebook will crop this image to 1.91:1'" apTooltipPosition="top" [apTooltipShowDelay]="200">
                                                    <ap-symbol symbolId="facebook" size="xs" color="orange"></ap-symbol>
                                                </span>
                                            }
                                            @if (state.instagramProfiles().length > 0) {
                                                <span class="net-badge warn" [apTooltip]="'Instagram will crop this image to square'" apTooltipPosition="top" [apTooltipShowDelay]="200">
                                                    <ap-symbol symbolId="instagram" size="xs" color="orange"></ap-symbol>
                                                </span>
                                            }
                                        </div>
                                    }
                                    <div class="media-overlay">
                                        <button><ap-symbol symbolId="more" size="xs" color="black"></ap-symbol></button>
                                        <button (click)="removeMedia(item.id)"><ap-symbol symbolId="trash" size="xs" color="red"></ap-symbol></button>
                                    </div>
                                </div>
                            }
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
                                    <div class="net-tabs inner-pad">
                                        <button class="net-tab" [class.active]="fbPostType()==='post'" (click)="fbPostType.set('post')">
                                            <ap-symbol symbolId="grid" size="xs"></ap-symbol> Post
                                        </button>
                                        <button class="net-tab" [class.active]="fbPostType()==='reel'" (click)="fbPostType.set('reel')">
                                            <ap-symbol symbolId="video" size="xs"></ap-symbol> Reel
                                        </button>
                                        <button class="net-tab" [class.active]="fbPostType()==='story'" (click)="fbPostType.set('story')">
                                            <ap-symbol symbolId="circle--outline" size="xs"></ap-symbol> Story
                                        </button>
                                    </div>
                                    <div class="field-group">
                                        <label class="field-label">Video title</label>
                                        <div class="field-textarea-wrap">
                                            <textarea class="field-textarea" [value]="state.fbVideoTitle()" (input)="state.fbVideoTitle.set(asTextarea($event))" placeholder="This is the title of the video" rows="3"></textarea>
                                            <div class="field-textarea-footer">
                                                <ap-icon-button symbolId="emoji" ariaLabel="Add emoji" type="flat" size="small"></ap-icon-button>
                                                <ap-button class="writing-assistant-btn" [config]="{ style: 'stroked', color: 'blue' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                            </div>
                                        </div>
                                        <div class="char-counts" style="padding: 4px 0 0;">
                                            <span class="char-count"><ap-symbol symbolId="facebook" size="xs" color="facebook"></ap-symbol> {{ state.fbCharsRemaining() | number }}</span>
                                        </div>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Boost this post</span><span class="option-hint">Text about what is post boosting</span></div>
                                        <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="ad" symbolPosition="left">Boost Post</ap-button>
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
                                    <div class="net-tabs inner-pad">
                                        <button class="net-tab" [class.active]="igPostType()==='post'" (click)="igPostType.set('post')">
                                            <ap-symbol symbolId="grid" size="xs"></ap-symbol> Post
                                        </button>
                                        <button class="net-tab" [class.active]="igPostType()==='reel'" (click)="igPostType.set('reel')">
                                            <ap-symbol symbolId="video" size="xs"></ap-symbol> Reel
                                        </button>
                                        <button class="net-tab" [class.active]="igPostType()==='story'" (click)="igPostType.set('story')">
                                            <ap-symbol symbolId="circle--outline" size="xs"></ap-symbol> Story
                                        </button>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                        <ap-slide-toggle [checked]="state.igMobileNotif()" (checkedChange)="state.igMobileNotif.set($event)"></ap-slide-toggle>
                                    </div>
                                    @if (igPostType() === 'reel') {
                                        <div class="option-row toggle-row">
                                            <div class="option-info"><span class="option-label">Also share to Feed</span></div>
                                            <ap-slide-toggle [checked]="state.igAlsoShareToFeed()" (checkedChange)="state.igAlsoShareToFeed.set($event)"></ap-slide-toggle>
                                        </div>
                                    }
                                    @if (igPostType() !== 'story') {
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
                                        @if (igPostType() === 'post') {
                                            <div class="option-row action-row">
                                                <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Tag users</span><span class="option-hint">No users</span></div></div>
                                                <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left">Tag users</ap-button>
                                            </div>
                                        }
                                        <div class="option-row action-row">
                                            <div class="option-info-row"><ap-symbol symbolId="user" size="xs" color="basic-grey"></ap-symbol><div class="option-info"><span class="option-label">Invite collaborator(s)</span><span class="option-hint">No collaborator(s)</span></div></div>
                                            <ap-button [config]="{ style: 'stroked', color: 'grey' }" size="small" symbolId="user--plus" symbolPosition="left">Invite collaborator(s)</ap-button>
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
                                        <ap-slide-toggle [checked]="state.liFirstComment()" (checkedChange)="state.liFirstComment.set($event)"></ap-slide-toggle>
                                    </div>
                                    @if (state.liFirstComment()) {
                                        <div class="first-comment-editor">
                                            <textarea class="post-textarea small" [value]="state.liFirstCommentText()" (input)="state.liFirstCommentText.set(asTextarea($event))" placeholder="Write your first comment…" rows="2"></textarea>
                                        </div>
                                    }
                                    <div class="option-section-title">Target audience settings</div>
                                    <div class="option-section-desc">Define the audience to display your post to</div>
                                    <button class="audience-link">Add industry</button>
                                    <button class="audience-link">Add job function</button>
                                    <button class="audience-link">Add seniority</button>
                                </div>
                            }
                        </div>
                    }

                    <!-- X (Twitter) -->
                    @if (state.twitterProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('twitter')" (click)="xOptionsExpanded.set(!xOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="x-twitter" size="sm" color="twitter"></ap-symbol><span class="network-label">X (Twitter) options</span></div>
                                <ap-symbol [symbolId]="xOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (xOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">X (Twitter) card</span><span class="option-hint">Post as an image instead of a X (Twitter) Card</span></div>
                                        <ap-slide-toggle [checked]="state.xTwitterCard()" (checkedChange)="state.xTwitterCard.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">X (Twitter) Thread</span><span class="option-hint">Publish a thread attached to your post</span></div>
                                        <ap-slide-toggle [checked]="state.xThread()" (checkedChange)="state.xThread.set($event)"></ap-slide-toggle>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    <!-- TikTok -->
                    @if (state.tiktokProfiles().length > 0) {
                        <div class="network-card">
                            <div class="collapsible-header padded" [style.background]="networkHeaderBg('tiktok')" (click)="ttOptionsExpanded.set(!ttOptionsExpanded())">
                                <div class="row-gap"><ap-symbol symbolId="tiktok" size="sm" color="tiktok"></ap-symbol><span class="network-label">TikTok options</span></div>
                                <ap-symbol [symbolId]="ttOptionsExpanded() ? 'chevron-up' : 'chevron-down'" size="xs" color="basic-grey"></ap-symbol>
                            </div>
                            @if (ttOptionsExpanded()) {
                                <div class="network-card-content">
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Allow comments</span></div>
                                        <ap-slide-toggle [checked]="state.ttAllowComments()" (checkedChange)="state.ttAllowComments.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Allow Duet</span><span class="option-hint">Allows you to post your video side-by-side with another creator's video</span></div>
                                        <ap-slide-toggle [checked]="state.ttAllowDuet()" (checkedChange)="state.ttAllowDuet.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Allow Stitch</span><span class="option-hint">Allows you to combine another video on TikTok with one you're creating</span></div>
                                        <ap-slide-toggle [checked]="state.ttAllowStitch()" (checkedChange)="state.ttAllowStitch.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Publish via Mobile Notification</span><span class="option-hint">We'll send a push notification from our mobile app so the selected owner can complete the action from their smartphone.</span></div>
                                        <ap-slide-toggle [checked]="state.ttMobileNotif()" (checkedChange)="state.ttMobileNotif.set($event)"></ap-slide-toggle>
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
                                                <ap-button class="writing-assistant-btn" [config]="{ style: 'stroked', color: 'blue' }" symbolId="sparkles" symbolPosition="left" size="small">Writing Assistant</ap-button>
                                            </div>
                                        </div>
                                        <div class="char-counts" style="padding: 4px 0 0;">
                                            <span class="char-count" [class.danger]="state.ytTitle().length > 280"><ap-symbol symbolId="youtube" size="xs" [color]="state.ytTitle().length > 280 ? 'red' : 'youtube'"></ap-symbol> {{ 280 - state.ytTitle().length }}</span>
                                        </div>
                                    </div>
                                    <div class="option-row">
                                        <div class="option-info"><span class="option-label">Privacy status</span></div>
                                        <div class="privacy-tabs">
                                            <button class="privacy-tab" [class.active]="state.ytPrivacy()==='public'" (click)="state.ytPrivacy.set('public')">Public</button>
                                            <button class="privacy-tab" [class.active]="state.ytPrivacy()==='private'" (click)="state.ytPrivacy.set('private')">Private</button>
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
                                        <ap-slide-toggle [checked]="state.ytEmbeddable()" (checkedChange)="state.ytEmbeddable.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Notify subscribers</span></div>
                                        <ap-slide-toggle [checked]="state.ytNotifySubscribers()" (checkedChange)="state.ytNotifySubscribers.set($event)"></ap-slide-toggle>
                                    </div>
                                    <div class="option-row toggle-row">
                                        <div class="option-info"><span class="option-label">Made for kids</span><span class="option-hint">Prevent underage users from watching this video. This also removes the ability to monetize or promote your video through different ad formats.</span></div>
                                        <ap-slide-toggle [checked]="state.ytMadeForKids()" (checkedChange)="state.ytMadeForKids.set($event)"></ap-slide-toggle>
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

            } <!-- end @if customized -->
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
        .compose-tabs {
            display: flex;
            border-bottom: 1px solid var(--ref-color-grey-15);
            padding: 0 16px;
            flex-shrink: 0;
            background: #F9F9FA;
        }
        .tab-btn {
            background: none; border: none; border-bottom: 2px solid transparent;
            padding: 12px 4px; margin-right: 20px;
            font-size: 14px; font-weight: 500;
            color: var(--sys-text-color-light);
            cursor: pointer; font-family: 'Averta', sans-serif;
            transition: color 0.15s, border-color 0.15s;
            display: flex; align-items: center; gap: 6px;
            &.active {
                color: var(--ref-color-electric-blue-100);
                border-bottom-color: var(--ref-color-electric-blue-100);
                font-weight: 600;
            }
            &:hover:not(.active) { color: var(--sys-text-color-default); }
        }
        .tab-badge {
            font-size: 11px; font-weight: 600;
            background: var(--ref-color-electric-blue-10);
            color: var(--ref-color-electric-blue-100);
            border-radius: 10px; padding: 1px 6px; min-width: 18px; text-align: center;
        }
        .panel-header {
            padding: 12px 0 4px; font-size: 13px; font-weight: 700;
            color: var(--sys-text-color-default);
        }
        .compose-content { flex: 1; min-height: 0; overflow-y: auto; padding: 0 16px 20px; background: #F9F9FA; }
        .section { padding: 12px 0; border-bottom: 1px solid var(--ref-color-grey-10); max-width: 640px; margin: 0 auto; &.last { border-bottom: none; } }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--sys-text-color-default); }
        .section-hint { font-size: 11px; color: var(--ref-color-grey-60); }

        .text-editor {
            border: 1px solid var(--sys-border-color-default); border-radius: 8px; overflow: hidden;
            background: var(--ref-color-white); transition: border-color 0.15s, box-shadow 0.15s;
            &.inner { border-radius: 6px; margin: 8px 0; }
            &.focused { border-color: var(--ref-color-electric-blue-60); box-shadow: 0 0 0 3px var(--ref-color-electric-blue-05); }
            textarea { min-height: 96px; transition: min-height 0.25s ease; }
            &.expanded textarea { min-height: 280px; }
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
        .toolbar-right { display: flex; align-items: center; gap: 4px; }
        .expand-btn {
            background: none; border: none; padding: 4px; cursor: pointer;
            display: flex; align-items: center; border-radius: 4px;
            opacity: 0.5; transition: opacity 0.15s, background 0.15s;
            &:hover { opacity: 1; background: var(--ref-color-grey-05); }
        }
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
            display: flex; align-items: center;
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

        .collapsible-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 0 8px; cursor: pointer; user-select: none;
            &.padded { padding: 10px 12px; }
        }
        .collapsible-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--sys-text-color-default); }
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
            .media-network-issues {
                position: absolute; bottom: 3px; left: 3px; display: flex; gap: 2px;
            }
            .net-badge {
                width: 16px; height: 16px; border-radius: 3px; display: flex; align-items: center; justify-content: center;
                &.warn { background: rgba(255, 247, 237, 0.92); }
            }
            .media-overlay {
                position: absolute; top: 2px; right: 2px; display: flex; gap: 2px;
                opacity: 0; transition: opacity 0.15s;
                button { width: 22px; height: 22px; border: none; border-radius: 4px; background: rgba(255,255,255,0.92); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
            }
            &:hover .media-overlay { opacity: 1; }
        }

        /* Customizations section hint */
        .customizations-hint { font-size: 11px; color: var(--ref-color-grey-60); margin: 0 0 8px; }

        /* Customization cards */
        .custom-card {
            border: 1px solid var(--sys-border-color-default);
            border-radius: 8px;
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
            transition: background 0.15s;
        }
        .profile-row { display: flex; align-items: center; gap: 8px; }
        .profile-label { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
        .row-gap { display: flex; align-items: center; gap: 6px; }
        .inner-pad { padding: 8px 12px 4px; }

        .option-row {
            display: flex; align-items: flex-start; justify-content: space-between;
            padding: 10px 12px; border-top: 1px solid var(--ref-color-grey-10); gap: 12px;
            &.toggle-row { align-items: center; }
            &.action-row { align-items: center; }
        }
        .option-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .option-info-row { display: flex; align-items: center; gap: 8px; flex: 1; }
        .option-label { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
        .option-hint { font-size: 11px; color: var(--ref-color-grey-60); line-height: 1.4; }

        .first-comment-editor {
            padding: 8px 12px 12px;
            border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-grey-02, #fafafa);
        }

        .network-hint { font-size: 11px; color: var(--ref-color-grey-60); margin: 0 0 8px; line-height: 1.5; }
        .network-card { border: 1px solid var(--sys-border-color-default); border-radius: 8px; margin-top: 8px; overflow: hidden; background: var(--ref-color-white); }
        .network-card-content { padding: 0 0 8px; }
        .network-label { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
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

        /* Per-profile media override */
        .custom-media-section {
            padding: 8px 12px 10px;
            border-top: 1px solid var(--ref-color-grey-10);
        }
        .custom-media-header {
            display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
        }
        .custom-media-label { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
        .custom-media-hint { font-size: 11px; color: var(--ref-color-grey-60); }
        .add-media-btn.small { width: 48px; height: 48px; }
        .media-thumb.small { width: 48px; height: 48px; border-radius: 6px; }

        /* Tab control for network options (matches main compose-tabs style) */
        .net-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--ref-color-grey-15); }
        .net-tab {
            display: flex; align-items: center; justify-content: center; gap: 4px;
            padding: 8px 12px; background: none; border: none;
            border-bottom: 2px solid transparent; margin-bottom: -1px;
            font-size: 12px; font-weight: 500; color: var(--sys-text-color-light); cursor: pointer;
            font-family: 'Averta', sans-serif; transition: color 0.15s, border-color 0.15s;
            &.active {
                color: var(--ref-color-electric-blue-100); font-weight: 600;
                border-bottom-color: var(--ref-color-electric-blue-100);
            }
            &:hover:not(.active) { color: var(--sys-text-color-default); }
        }

        /* LinkedIn audience targeting */
        .option-section-title {
            padding: 10px 12px 2px; font-size: 11px; font-weight: 700;
            color: var(--sys-text-color-light); text-transform: uppercase; letter-spacing: 0.04em;
            border-top: 1px solid var(--ref-color-grey-10);
        }
        .option-section-desc { padding: 2px 12px 6px; font-size: 11px; color: var(--ref-color-grey-60); line-height: 1.4; }
        .audience-link {
            display: block; width: 100%; background: none; border: none; border-top: 1px solid var(--ref-color-grey-10);
            padding: 10px 12px; text-align: left; cursor: pointer;
            color: var(--comp-link-default-color); font-size: 12px; font-weight: 600;
            font-family: 'Averta', sans-serif;
            &:hover { color: var(--comp-link-hover-color); }
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
            width: 100%; padding: 7px 10px; border: 1px solid var(--sys-border-color-default);
            border-radius: 6px; font-size: 12px; color: var(--sys-text-color-default);
            font-family: 'Averta', sans-serif; background: var(--ref-color-white);
            outline: none; cursor: pointer;
            &:focus { border-color: var(--ref-color-electric-blue-60); }
        }
        .field-input {
            width: 100%; padding: 7px 10px; border: 1px solid var(--sys-border-color-default);
            border-radius: 6px; font-size: 12px; color: var(--sys-text-color-default);
            font-family: 'Averta', sans-serif; background: var(--ref-color-white);
            outline: none; box-sizing: border-box;
            &::placeholder { color: var(--ref-color-grey-60); }
            &:focus { border-color: var(--ref-color-electric-blue-60); }
        }
        .required-star { color: var(--ref-color-red-100); }
        .optional-label { color: var(--ref-color-grey-60); font-weight: 400; }

        /* Privacy segmented control (YouTube) */
        .privacy-tabs { display: flex; }
        .privacy-tab {
            padding: 5px 12px; border: 1px solid var(--sys-border-color-default); background: none;
            font-size: 11px; font-weight: 500; color: var(--ref-color-grey-60); cursor: pointer;
            font-family: 'Averta', sans-serif; transition: all 0.15s;
            &:first-child { border-radius: 6px 0 0 6px; }
            &:last-child { border-radius: 0 6px 6px 0; border-left: none; }
            &.active { background: var(--ref-color-electric-blue-100); border-color: var(--ref-color-electric-blue-100); color: white; font-weight: 600; }
        }
    `],
})
export class ComposePanelComponent {
    state = inject(ComposeStateService);
    private el = inject(ElementRef);

    activeTab = signal<'base' | 'customized'>('base');
    baseTextFocused = signal(false);
    baseEditorExpanded = signal(false);
    focusedEditorId = signal<string | null>(null);
    flashingId = signal<string | null>(null);
    mediaExpanded = signal(true);
    customizationsExpanded = signal(true);
    fbOptionsExpanded = signal(true);
    igOptionsExpanded = signal(true);
    liOptionsExpanded = signal(true);
    xOptionsExpanded = signal(true);
    ttOptionsExpanded = signal(true);
    ytOptionsExpanded = signal(true);

    fbPostType = signal<'post' | 'reel' | 'story'>('post');
    igPostType = signal<'post' | 'reel' | 'story'>('post');

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
        return network === 'twitter' ? 'x-twitter' : network;
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

    addMedia(): void {
        const idx = this.state.mediaItems().length % this.extraMedia.length;
        const m = this.extraMedia[idx];
        this.state.addMediaItem({ id: Date.now(), ...m });
    }

    addCustomMedia(profileId: string): void {
        const custom = this.state.getCustomization(profileId);
        const idx = (custom?.mediaItems.length ?? 0) % this.extraMedia.length;
        const m = this.extraMedia[idx];
        this.state.addCustomizationMedia(profileId, { id: Date.now(), ...m });
    }

    removeMedia(id: number): void {
        this.state.removeMediaItem(id);
    }
}
