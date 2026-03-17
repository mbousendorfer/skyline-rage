import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { InfoboxComponent } from '@agorapulse/ui-components/infobox';
import { TooltipDirective } from '@agorapulse/ui-components/tooltip';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { ComposeStateService } from '../compose-state';

interface Validation {
    key: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    closable: boolean;
    /** If set, shows an action button that calls openCustomization for this profile */
    customizeProfileId?: string;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-preview-panel',
    imports: [AvatarComponent, IconButtonComponent, InfoboxComponent, TooltipDirective, SymbolComponent],
    template: `
        <div class="preview-panel">
            <div class="panel-header">Social Media Previews</div>

            <!-- Status bar — errors are clickable and scroll to first error -->
            <div class="status-bar">
                @if (okCount() > 0) {
                    <span class="status ready">
                        <ap-symbol symbolId="check-circle" size="xs" color="basic-grey"></ap-symbol>
                        {{ okCount() }} ready
                    </span>
                }
                @if (warnCount() > 0) {
                    <button class="status warn clickable" (click)="scrollToFirstWarning()" [apTooltip]="'Jump to first warning'" apTooltipPosition="bottom" [apTooltipShowDelay]="400">
                        <ap-symbol symbolId="warning" size="xs" color="orange"></ap-symbol>
                        {{ warnCount() }} warning{{ warnCount() !== 1 ? 's' : '' }}
                        <ap-symbol symbolId="arrow-down" size="xs" color="orange"></ap-symbol>
                    </button>
                }
                @if (errCount() > 0) {
                    <button class="status err clickable" (click)="scrollToFirstError()" [apTooltip]="'Jump to first error'" apTooltipPosition="bottom" [apTooltipShowDelay]="400">
                        <ap-symbol symbolId="error" size="xs" color="red"></ap-symbol>
                        {{ errCount() }} error{{ errCount() !== 1 ? 's' : '' }}
                        <ap-symbol symbolId="arrow-down" size="xs" color="red"></ap-symbol>
                    </button>
                }
            </div>

            @if (state.selectedProfiles().length === 0) {
                <div class="empty-state">
                    <ap-symbol symbolId="eye" size="lg" color="basic-grey"></ap-symbol>
                    <p>Select profiles to see a preview of your post</p>
                </div>
            } @else {
                <div class="previews-list" #previewsList>

                    <!-- ── Facebook ─────────────────────────────────────── -->
                    @if (state.facebookProfiles().length > 0) {
                        <div class="network-section">
                            <div class="network-header" (click)="fbExpanded.set(!fbExpanded())">
                                <div class="network-title">
                                    @if (hasFbErrors()) { <span class="net-error-dot" [apTooltip]="'This network has validation errors'" apTooltipPosition="right" [apTooltipShowDelay]="200"></span> }
                                    <ap-symbol symbolId="facebook" size="sm" color="facebook"></ap-symbol>
                                    <span>Facebook</span>
                                </div>
                                <div class="network-right">
                                    <span class="posts-count">{{ state.facebookProfiles().length }} post(s)</span>
                                    <ap-icon-button [symbolId]="fbExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat" size="small"></ap-icon-button>
                                </div>
                            </div>
                            @if (fbExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.facebookProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <button class="customize-link" [class.active]="state.isCustomized(profile.id)" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">
                                                    <ap-symbol symbolId="pen" size="xs" [color]="state.isCustomized(profile.id) ? 'azure' : 'basic-grey'"></ap-symbol>
                                                    {{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}
                                                </button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <span class="customized-badge">
                                                        <ap-symbol symbolId="check" size="xs" color="azure"></ap-symbol>
                                                        Customized
                                                    </span>
                                                }
                                            </div>
                                            @for (v of fbValidations(profile.id); track v.key) {
                                                @if (!isDismissed(v.key)) {
                                                    <div class="validation-item">
                                                        <ap-infobox
                                                            [title]="v.title"
                                                            [type]="v.type"
                                                            [closable]="v.closable"
                                                            [buttonLabel]="v.customizeProfileId ? 'Customize this profile' : ''"
                                                            (buttonClicked)="v.customizeProfileId && openCustomization(v.customizeProfileId)"
                                                            (closed)="dismiss(v.key)">
                                                            {{ v.message }}
                                                        </ap-infobox>
                                                    </div>
                                                }
                                            }
                                            <div class="fb-card" [class.has-error]="fbProfileHasError(profile.id)">
                                                <div class="post-header">
                                                    <ap-avatar [username]="profile.name" network="facebook" [size]="36"></ap-avatar>
                                                    <div class="post-meta">
                                                        <div class="post-author">{{ profile.name }}</div>
                                                        <div class="post-date">27 novembre, à 13 h 37 · <ap-symbol symbolId="web" size="xs" color="basic-grey"></ap-symbol></div>
                                                    </div>
                                                </div>
                                                <div class="post-text">{{ state.getDisplayText(profile.id) }}</div>
                                                @if (state.getDisplayMedia(profile.id).length > 0) {
                                                    <div class="carousel">
                                                        <div class="carousel-track" [style.transform]="'translateX(-' + getCarouselIndex(profile.id) * 100 + '%)'">
                                                            @for (img of state.getDisplayMedia(profile.id); track img.id) {
                                                                <div class="carousel-slide"><img [src]="img.url" alt="Post" /></div>
                                                            }
                                                        </div>
                                                        @if (state.getDisplayMedia(profile.id).length > 1) {
                                                            <button class="carousel-btn prev" (click)="prevSlide(profile.id)" [disabled]="getCarouselIndex(profile.id) === 0"><ap-symbol symbolId="chevron-left" size="xs" color="white"></ap-symbol></button>
                                                            <button class="carousel-btn next" (click)="nextSlide(profile.id, state.getDisplayMedia(profile.id).length)" [disabled]="getCarouselIndex(profile.id) === state.getDisplayMedia(profile.id).length - 1"><ap-symbol symbolId="chevron-right" size="xs" color="white"></ap-symbol></button>
                                                            <div class="carousel-dots">
                                                                @for (img of state.getDisplayMedia(profile.id); track img.id; let i = $index) {
                                                                    <span class="carousel-dot" [class.active]="getCarouselIndex(profile.id) === i" (click)="setCarouselIndex(profile.id, i)"></span>
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                                <div class="fb-actions">
                                                    <button class="fb-btn"><ap-symbol symbolId="ns-facebook_like" size="sm" color="basic-grey"></ap-symbol> Like</button>
                                                    <button class="fb-btn"><ap-symbol symbolId="ns-facebook_comment" size="sm" color="basic-grey"></ap-symbol> Comment</button>
                                                    <button class="fb-btn"><ap-symbol symbolId="ns-facebook_share" size="sm" color="basic-grey"></ap-symbol> Share</button>
                                                </div>
                                                @if (state.getCustomization(profile.id)?.firstComment && state.getCustomization(profile.id)?.firstCommentText) {
                                                    <div class="first-comment-preview">
                                                        <ap-avatar [username]="profile.name" network="facebook" [size]="24"></ap-avatar>
                                                        <div class="comment-bubble">{{ state.getCustomization(profile.id)?.firstCommentText }}</div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <!-- ── LinkedIn ─────────────────────────────────────── -->
                    @if (state.linkedinProfiles().length > 0) {
                        <div class="network-section">
                            <div class="network-header" (click)="liExpanded.set(!liExpanded())">
                                <div class="network-title">
                                    @if (hasLiErrors()) { <span class="net-error-dot" [apTooltip]="'This network has validation errors'" apTooltipPosition="right" [apTooltipShowDelay]="200"></span> }
                                    <ap-symbol symbolId="linkedin" size="sm" color="linkedin"></ap-symbol>
                                    <span>LinkedIn</span>
                                </div>
                                <div class="network-right">
                                    <span class="posts-count">{{ state.linkedinProfiles().length }} post(s)</span>
                                    <ap-icon-button [symbolId]="liExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat" size="small"></ap-icon-button>
                                </div>
                            </div>
                            @if (liExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.linkedinProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <button class="customize-link" [class.active]="state.isCustomized(profile.id)" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">
                                                    <ap-symbol symbolId="pen" size="xs" [color]="state.isCustomized(profile.id) ? 'azure' : 'basic-grey'"></ap-symbol>
                                                    {{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}
                                                </button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <span class="customized-badge">
                                                        <ap-symbol symbolId="check" size="xs" color="azure"></ap-symbol>
                                                        Customized
                                                    </span>
                                                }
                                            </div>
                                            @for (v of liValidations(profile.id); track v.key) {
                                                @if (!isDismissed(v.key)) {
                                                    <div class="validation-item">
                                                        <ap-infobox
                                                            [title]="v.title"
                                                            [type]="v.type"
                                                            [closable]="v.closable"
                                                            [buttonLabel]="v.customizeProfileId ? 'Customize this profile' : ''"
                                                            (buttonClicked)="v.customizeProfileId && openCustomization(v.customizeProfileId)"
                                                            (closed)="dismiss(v.key)">
                                                            {{ v.message }}
                                                        </ap-infobox>
                                                    </div>
                                                }
                                            }
                                            <div class="li-card" [class.has-error]="liProfileHasError(profile.id)">
                                                <div class="post-header">
                                                    <ap-avatar [username]="profile.name" network="linkedin" [size]="40"></ap-avatar>
                                                    <div class="post-meta">
                                                        <div class="post-author">{{ profile.name }}</div>
                                                        <div class="post-date">Just now · <ap-symbol symbolId="web" size="xs" color="basic-grey"></ap-symbol></div>
                                                    </div>
                                                </div>
                                                <div class="post-text">
                                                    {{ liDisplayText(profile.id) }}
                                                    @if (state.getDisplayText(profile.id).length > 700) {
                                                        <span class="see-more">… see more</span>
                                                    }
                                                </div>
                                                @if (state.getDisplayMedia(profile.id).length > 0) {
                                                    <div class="carousel">
                                                        <div class="carousel-track" [style.transform]="'translateX(-' + getCarouselIndex(profile.id) * 100 + '%)'">
                                                            @for (img of state.getDisplayMedia(profile.id); track img.id) {
                                                                <div class="carousel-slide"><img [src]="img.url" alt="Post" /></div>
                                                            }
                                                        </div>
                                                        @if (state.getDisplayMedia(profile.id).length > 1) {
                                                            <button class="carousel-btn prev" (click)="prevSlide(profile.id)" [disabled]="getCarouselIndex(profile.id) === 0"><ap-symbol symbolId="chevron-left" size="xs" color="white"></ap-symbol></button>
                                                            <button class="carousel-btn next" (click)="nextSlide(profile.id, state.getDisplayMedia(profile.id).length)" [disabled]="getCarouselIndex(profile.id) === state.getDisplayMedia(profile.id).length - 1"><ap-symbol symbolId="chevron-right" size="xs" color="white"></ap-symbol></button>
                                                            <div class="carousel-dots">
                                                                @for (img of state.getDisplayMedia(profile.id); track img.id; let i = $index) {
                                                                    <span class="carousel-dot" [class.active]="getCarouselIndex(profile.id) === i" (click)="setCarouselIndex(profile.id, i)"></span>
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                                <div class="li-actions">
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_like" size="sm" color="basic-grey"></ap-symbol> Like</button>
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_comment" size="sm" color="basic-grey"></ap-symbol> Comment</button>
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_repost" size="sm" color="basic-grey"></ap-symbol> Repost</button>
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_send" size="sm" color="basic-grey"></ap-symbol> Send</button>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <!-- ── Instagram ────────────────────────────────────── -->
                    @if (state.instagramProfiles().length > 0) {
                        <div class="network-section">
                            <div class="network-header" (click)="igExpanded.set(!igExpanded())">
                                <div class="network-title">
                                    @if (hasIgErrors()) { <span class="net-error-dot" [apTooltip]="'This network has validation errors'" apTooltipPosition="right" [apTooltipShowDelay]="200"></span> }
                                    <ap-symbol symbolId="instagram" size="sm" color="instagram"></ap-symbol>
                                    <span>Instagram</span>
                                </div>
                                <div class="network-right">
                                    <span class="posts-count">{{ state.instagramProfiles().length }} post(s)</span>
                                    <ap-icon-button [symbolId]="igExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat" size="small"></ap-icon-button>
                                </div>
                            </div>
                            @if (igExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.instagramProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <button class="customize-link" [class.active]="state.isCustomized(profile.id)" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">
                                                    <ap-symbol symbolId="pen" size="xs" [color]="state.isCustomized(profile.id) ? 'azure' : 'basic-grey'"></ap-symbol>
                                                    {{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}
                                                </button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <span class="customized-badge">
                                                        <ap-symbol symbolId="check" size="xs" color="azure"></ap-symbol>
                                                        Customized
                                                    </span>
                                                }
                                            </div>
                                            @for (v of igValidations(profile.id); track v.key) {
                                                @if (!isDismissed(v.key)) {
                                                    <div class="validation-item">
                                                        <ap-infobox
                                                            [title]="v.title"
                                                            [type]="v.type"
                                                            [closable]="v.closable"
                                                            [buttonLabel]="v.customizeProfileId ? 'Customize this profile' : ''"
                                                            (buttonClicked)="v.customizeProfileId && openCustomization(v.customizeProfileId)"
                                                            (closed)="dismiss(v.key)">
                                                            {{ v.message }}
                                                        </ap-infobox>
                                                    </div>
                                                }
                                            }
                                            <div class="ig-card" [class.has-error]="igProfileHasError(profile.id)">
                                                <div class="ig-header">
                                                    <ap-avatar [username]="profile.name" [size]="32"></ap-avatar>
                                                    <div class="ig-meta">
                                                        <span class="ig-author">{{ profile.name }}</span>
                                                        <span class="ig-time">Now</span>
                                                    </div>
                                                </div>
                                                @if (state.getDisplayMedia(profile.id).length > 0) {
                                                    <div class="carousel ig">
                                                        <div class="carousel-track" [style.transform]="'translateX(-' + getCarouselIndex(profile.id) * 100 + '%)'">
                                                            @for (img of state.getDisplayMedia(profile.id); track img.id) {
                                                                <div class="carousel-slide"><img [src]="img.url" alt="Post" /></div>
                                                            }
                                                        </div>
                                                        @if (state.getDisplayMedia(profile.id).length > 1) {
                                                            <button class="carousel-btn prev" (click)="prevSlide(profile.id)" [disabled]="getCarouselIndex(profile.id) === 0"><ap-symbol symbolId="chevron-left" size="xs" color="white"></ap-symbol></button>
                                                            <button class="carousel-btn next" (click)="nextSlide(profile.id, state.getDisplayMedia(profile.id).length)" [disabled]="getCarouselIndex(profile.id) === state.getDisplayMedia(profile.id).length - 1"><ap-symbol symbolId="chevron-right" size="xs" color="white"></ap-symbol></button>
                                                            <div class="carousel-dots">
                                                                @for (img of state.getDisplayMedia(profile.id); track img.id; let i = $index) {
                                                                    <span class="carousel-dot" [class.active]="getCarouselIndex(profile.id) === i" (click)="setCarouselIndex(profile.id, i)"></span>
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                                <div class="ig-actions">
                                                    <div class="ig-actions-left">
                                                        <ap-symbol symbolId="ns-instagram_like" size="md"></ap-symbol>
                                                        <ap-symbol symbolId="ns-instagram_comment" size="md"></ap-symbol>
                                                        <ap-symbol symbolId="ns-instagram_share" size="md"></ap-symbol>
                                                    </div>
                                                    <ap-symbol symbolId="ns-instagram_bookmark" size="md"></ap-symbol>
                                                </div>
                                                <div class="ig-caption">
                                                    <strong>{{ profile.name }}</strong>
                                                    {{ igCaptionPreview(profile.id) }}
                                                    @if (state.getDisplayText(profile.id).length > 125) {
                                                        <span class="see-more">… more</span>
                                                    }
                                                </div>
                                                @if (state.getCustomization(profile.id)?.firstComment && state.getCustomization(profile.id)?.firstCommentText) {
                                                    <div class="ig-first-comment">
                                                        <strong>{{ profile.name }}</strong> {{ state.getCustomization(profile.id)?.firstCommentText }}
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <!-- ── X / Twitter ──────────────────────────────────── -->
                    @if (state.twitterProfiles().length > 0) {
                        <div class="network-section">
                            <div class="network-header" (click)="xExpanded.set(!xExpanded())">
                                <div class="network-title">
                                    @if (hasXErrors()) { <span class="net-error-dot" [apTooltip]="'This network has validation errors'" apTooltipPosition="right" [apTooltipShowDelay]="200"></span> }
                                    <ap-symbol symbolId="x-twitter" size="sm" color="twitter"></ap-symbol>
                                    <span>X (Twitter)</span>
                                </div>
                                <div class="network-right">
                                    <span class="posts-count">{{ state.twitterProfiles().length }} post(s)</span>
                                    <ap-icon-button [symbolId]="xExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat" size="small"></ap-icon-button>
                                </div>
                            </div>
                            @if (xExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.twitterProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <button class="customize-link" [class.active]="state.isCustomized(profile.id)" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">
                                                    <ap-symbol symbolId="pen" size="xs" [color]="state.isCustomized(profile.id) ? 'azure' : 'basic-grey'"></ap-symbol>
                                                    {{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}
                                                </button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <span class="customized-badge">
                                                        <ap-symbol symbolId="check" size="xs" color="azure"></ap-symbol>
                                                        Customized
                                                    </span>
                                                }
                                            </div>
                                            @for (v of xValidations(profile.id); track v.key) {
                                                @if (!isDismissed(v.key)) {
                                                    <div class="validation-item">
                                                        <ap-infobox
                                                            [title]="v.title"
                                                            [type]="v.type"
                                                            [closable]="v.closable"
                                                            [buttonLabel]="v.customizeProfileId ? 'Customize this profile' : ''"
                                                            (buttonClicked)="v.customizeProfileId && openCustomization(v.customizeProfileId)"
                                                            (closed)="dismiss(v.key)">
                                                            {{ v.message }}
                                                        </ap-infobox>
                                                    </div>
                                                }
                                            }
                                            <div class="x-card" [class.has-error]="xProfileHasError(profile.id)">
                                                <div class="post-header">
                                                    <ap-avatar [username]="profile.name" network="twitter" [size]="36"></ap-avatar>
                                                    <div class="post-meta">
                                                        <div class="post-author">{{ profile.name }}</div>
                                                        <div class="post-date">Just now</div>
                                                    </div>
                                                </div>
                                                <div class="post-text">{{ truncate(state.getDisplayText(profile.id), 280) }}</div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    <div style="height: 24px; flex-shrink: 0;"></div>
                </div>
            }
        </div>
    `,
    styles: [`
        :host { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .preview-panel {
            display: flex; flex-direction: column;
            flex: 1; min-height: 0; min-width: 0;
            background: #F2F3F5; overflow: hidden;
        }
        .panel-header {
            padding: 10px 14px; font-size: 12px; font-weight: 600;
            color: var(--sys-text-color-default);
            border-bottom: 1px solid var(--sys-border-color-default);
            background: #F2F3F5; flex-shrink: 0;
        }
        .status-bar {
            display: flex; gap: 14px; padding: 7px 14px; align-items: center;
            background: #F2F3F5; border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .status {
            display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500;
            &.ready { color: var(--ref-color-grey-60); }
            &.warn  { color: var(--ref-color-orange-100); }
            &.err   { color: var(--ref-color-red-100); }
        }
        button.status.clickable {
            background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px;
            font-family: 'Averta', sans-serif; font-size: 12px; font-weight: 500;
            transition: background 0.15s;
            &.err { color: var(--ref-color-red-100);    &:hover { background: var(--ref-color-red-05, #fff5f5); } }
            &.warn { color: var(--ref-color-orange-100); &:hover { background: #fff7ed; } }
        }
        .empty-state {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 12px; padding: 24px; text-align: center;
            p { font-size: 13px; color: var(--ref-color-grey-60); margin: 0; line-height: 1.5; }
        }
        .previews-list {
            flex: 1; min-height: 0; overflow-y: auto; background: #F2F3F5;
            display: flex; flex-direction: column; align-items: center;
            scroll-behavior: smooth;
        }
        .network-section { width: 100%; max-width: 500px; padding: 16px 16px 0; }
        .network-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 0 10px; cursor: pointer;
        }
        .network-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--sys-text-color-default); }
        .network-right { display: flex; align-items: center; gap: 6px; }
        .posts-count { font-size: 11px; color: var(--ref-color-grey-60); }
        .net-error-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: var(--ref-color-red-100); flex-shrink: 0;
        }

        .preview-cards { padding: 0 0 16px; }
        .preview-card-wrapper {
            margin-bottom: 8px; scroll-margin-top: 12px; border-radius: 10px;
            transition: background 0.2s, box-shadow 0.2s;
            &.is-customized {
                background: var(--ref-color-electric-blue-02, #f5f8ff);
                box-shadow: 0 0 0 2px var(--ref-color-electric-blue-40);
                padding: 4px;
                margin: 0 -4px 8px;
            }
        }

        /* Customize bar */
        .customize-bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
        .customize-link {
            display: flex; align-items: center; gap: 4px; background: none; border: none;
            color: var(--ref-color-grey-60); font-size: 12px; cursor: pointer; padding: 2px 6px 2px 0;
            font-family: 'Averta', sans-serif; border-radius: 4px; transition: all 0.15s;
            &:hover, &.active { color: var(--ref-color-electric-blue-100); }
            &:hover { background: var(--ref-color-electric-blue-05); }
        }
        .customized-badge {
            display: flex; align-items: center; gap: 4px;
            font-size: 11px; font-weight: 600;
            background: var(--ref-color-electric-blue-10);
            color: var(--ref-color-electric-blue-100);
            border-radius: 10px; padding: 2px 8px;
        }

        /* Infoboxes */
        .validation-item { margin-bottom: 6px; }

        /* Post cards */
        .fb-card, .li-card, .ig-card, .x-card {
            border: 1px solid var(--sys-border-color-default);
            border-radius: 8px; overflow: hidden; background: var(--ref-color-white);
            &.has-error { border-color: var(--ref-color-red-40, #fca5a5); }
        }
        .x-card { padding-bottom: 10px; }

        .post-header { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
        .post-meta { flex: 1; }
        .post-author { font-size: 13px; font-weight: 600; color: var(--sys-text-color-default); }
        .post-date { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--ref-color-grey-60); margin-top: 2px; }
        .post-text { padding: 2px 12px 10px; font-size: 13px; color: var(--sys-text-color-default); line-height: 1.5; }
        /* Carousel */
        .carousel {
            position: relative; overflow: hidden;
            &.ig .carousel-slide img { height: 280px; }
        }
        .carousel-track { display: flex; transition: transform 0.3s ease; }
        .carousel-slide {
            flex: 0 0 100%;
            img { width: 100%; height: 200px; object-fit: cover; display: block; }
        }
        .carousel-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            background: rgba(0,0,0,0.45); border: none; border-radius: 50%;
            width: 28px; height: 28px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s; z-index: 2;
            &:hover:not(:disabled) { background: rgba(0,0,0,0.65); }
            &:disabled { opacity: 0.25; cursor: default; }
            &.prev { left: 8px; }
            &.next { right: 8px; }
        }
        .carousel-dots {
            position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 5px; z-index: 2;
        }
        .carousel-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: rgba(255,255,255,0.55); cursor: pointer; transition: background 0.15s;
            &.active { background: white; }
        }
        .see-more { font-size: 12px; color: var(--ref-color-electric-blue-100); cursor: pointer; font-weight: 500; }

        .fb-actions { display: flex; padding: 4px; border-top: 1px solid var(--ref-color-grey-10); }
        .fb-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 8px; background: none; border: none; border-radius: 6px;
            font-size: 12px; color: var(--sys-text-color-light); cursor: pointer; font-family: 'Averta', sans-serif;
            &:hover { background: var(--ref-color-grey-05); }
        }
        .first-comment-preview {
            display: flex; align-items: flex-start; gap: 8px;
            padding: 8px 12px; border-top: 1px solid var(--ref-color-grey-10);
            background: var(--ref-color-grey-02, #fafafa);
        }
        .comment-bubble {
            flex: 1; background: var(--ref-color-grey-05); border-radius: 12px;
            padding: 6px 10px; font-size: 12px; color: var(--sys-text-color-default); line-height: 1.4;
        }
        .li-actions { display: flex; padding: 4px; border-top: 1px solid var(--ref-color-grey-10); }
        .li-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
            padding: 8px 4px; background: none; border: none; border-radius: 6px;
            font-size: 11px; color: var(--sys-text-color-light); cursor: pointer; font-family: 'Averta', sans-serif;
            &:hover { background: var(--ref-color-grey-05); }
        }
        .ig-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
        .ig-meta { display: flex; flex-direction: column; }
        .ig-author { font-size: 12px; font-weight: 600; color: var(--sys-text-color-default); }
        .ig-time { font-size: 11px; color: var(--ref-color-grey-60); }
        .ig-actions { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; }
        .ig-actions-left { display: flex; gap: 12px; }
        .ig-caption { padding: 2px 12px 10px; font-size: 12px; color: var(--sys-text-color-default); line-height: 1.5; }
        .ig-first-comment { padding: 6px 12px 10px; font-size: 12px; color: var(--ref-color-grey-60); border-top: 1px solid var(--ref-color-grey-10); }
    `],
})
export class PreviewPanelComponent {
    state = inject(ComposeStateService);
    private el = inject(ElementRef);

    fbExpanded = signal(true);
    liExpanded = signal(true);
    igExpanded = signal(true);
    xExpanded = signal(true);

    // ── Carousel state ───────────────────────────────────────────────────────
    private carouselIndices = signal<Record<string, number>>({});

    getCarouselIndex(profileId: string): number {
        return this.carouselIndices()[profileId] ?? 0;
    }

    setCarouselIndex(profileId: string, idx: number): void {
        this.carouselIndices.update(m => ({ ...m, [profileId]: idx }));
    }

    prevSlide(profileId: string): void {
        const cur = this.getCarouselIndex(profileId);
        if (cur > 0) this.setCarouselIndex(profileId, cur - 1);
    }

    nextSlide(profileId: string, total: number): void {
        const cur = this.getCarouselIndex(profileId);
        if (cur < total - 1) this.setCarouselIndex(profileId, cur + 1);
    }

    private dismissed = signal(new Set<string>());

    isDismissed(key: string): boolean { return this.dismissed().has(key); }
    dismiss(key: string): void { this.dismissed.update(s => new Set([...s, key])); }

    /** Open customization in compose panel and scroll preview to that card (after DOM update). */
    openCustomization(profileId: string): void {
        this.state.openCustomization(profileId);
        // Also scroll the preview card into view to keep context
        setTimeout(() => {
            const card = this.el.nativeElement.querySelector(`#pcard-${profileId}`);
            card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
    }

    private expandNetwork(profileId: string): void {
        const net = this.state.allProfiles().find(p => p.id === profileId)?.network;
        if (net === 'facebook') this.fbExpanded.set(true);
        else if (net === 'linkedin') this.liExpanded.set(true);
        else if (net === 'instagram') this.igExpanded.set(true);
        else if (net === 'twitter') this.xExpanded.set(true);
    }

    private scrollToCard(profileId: string): void {
        this.expandNetwork(profileId);
        setTimeout(() => {
            const card = this.el.nativeElement.querySelector(`#pcard-${profileId}`);
            card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
    }

    /** Scroll preview to the first card that has an active warning/info. */
    scrollToFirstWarning(): void {
        const id = this.firstWarningProfileId();
        if (id) this.scrollToCard(id);
    }

    /** Scroll preview to the first card that has an error. */
    scrollToFirstError(): void {
        const id = this.firstErrorProfileId();
        if (id) this.scrollToCard(id);
    }

    firstWarningProfileId = computed(() => {
        const d = this.dismissed();
        const hasWarn = (validations: Validation[]) =>
            validations.some(v => v.type !== 'error' && !d.has(v.key));
        for (const p of this.state.facebookProfiles())  { if (hasWarn(this.fbValidations(p.id))) return p.id; }
        for (const p of this.state.linkedinProfiles())  { if (hasWarn(this.liValidations(p.id))) return p.id; }
        for (const p of this.state.instagramProfiles()) { if (hasWarn(this.igValidations(p.id))) return p.id; }
        for (const p of this.state.twitterProfiles())   { if (hasWarn(this.xValidations(p.id)))  return p.id; }
        return null;
    });

    firstErrorProfileId = computed(() => {
        for (const p of this.state.facebookProfiles())  { if (this.fbProfileHasError(p.id)) return p.id; }
        for (const p of this.state.linkedinProfiles())  { if (this.liProfileHasError(p.id)) return p.id; }
        for (const p of this.state.instagramProfiles()) { if (this.igProfileHasError(p.id)) return p.id; }
        for (const p of this.state.twitterProfiles())   { if (this.xProfileHasError(p.id))  return p.id; }
        return null;
    });

    // ── Validation builders ──────────────────────────────────────────────────

    fbValidations(profileId: string): Validation[] {
        const text = this.state.getDisplayText(profileId);
        const result: Validation[] = [];
        if (this.state.hasLandscapeMedia()) {
            result.push({ key: `fb-${profileId}-landscape`, type: 'warning', closable: true, customizeProfileId: undefined,
                title: 'Image will be auto-cropped',
                message: 'Your media is 16:9 landscape. Facebook Feed crops to 1.91:1 — the left and right edges will be trimmed. Upload a 1.91:1 or square image for full control.',
            });
        }
        if (text.length > 10000) {
            result.push({ key: `fb-${profileId}-too-long`, type: 'error', closable: false, customizeProfileId: profileId,
                title: `Caption too long (${text.length.toLocaleString()}/10,000)`,
                message: `Trim ${(text.length - 10000).toLocaleString()} characters to publish, or customize this profile with a shorter version.`,
            });
        }
        return result;
    }

    liValidations(profileId: string): Validation[] {
        const text = this.state.getDisplayText(profileId);
        const result: Validation[] = [];
        if (text.length > 700 && text.length <= 3000) {
            result.push({ key: `li-${profileId}-see-more`, type: 'info', closable: true, customizeProfileId: profileId,
                title: 'Text will be collapsed',
                message: 'LinkedIn shows only the first ~700 characters before a "see more" button. Move your key message to the opening lines — or customize this profile.',
            });
        }
        if (text.length > 3000) {
            result.push({ key: `li-${profileId}-too-long`, type: 'error', closable: false, customizeProfileId: profileId,
                title: `Post too long (${text.length.toLocaleString()}/3,000)`,
                message: `Trim ${(text.length - 3000).toLocaleString()} characters to publish, or customize this profile with a shorter version.`,
            });
        }
        return result;
    }

    igValidations(profileId: string): Validation[] {
        const text = this.state.getDisplayText(profileId);
        const result: Validation[] = [];
        if (this.state.hasLandscapeMedia()) {
            result.push({ key: `ig-${profileId}-aspect-ratio`, type: 'warning', closable: true, customizeProfileId: undefined,
                title: 'Image will be cropped to square',
                message: 'Your media is 16:9 landscape. Instagram auto-crops to 1:1 in the feed. Upload a 1:1 or 4:5 portrait image for best reach.',
            });
        }
        if (text.length > 125 && text.length <= 2200) {
            result.push({ key: `ig-${profileId}-truncated`, type: 'info', closable: true, customizeProfileId: profileId,
                title: 'Caption will be truncated in feed',
                message: `Only the first 125 characters show before a "more" button. Your caption is ${text.length} characters — lead with your hook, or customize for Instagram.`,
            });
        }
        if (text.length > 2200) {
            result.push({ key: `ig-${profileId}-too-long`, type: 'error', closable: false, customizeProfileId: profileId,
                title: `Caption too long (${text.length.toLocaleString()}/2,200)`,
                message: `Trim ${(text.length - 2200).toLocaleString()} characters to publish, or customize this profile with a shorter version.`,
            });
        }
        return result;
    }

    xValidations(profileId: string): Validation[] {
        const text = this.state.getDisplayText(profileId);
        const result: Validation[] = [];
        if (text.length > 100 && text.length <= 280) {
            result.push({ key: `x-${profileId}-length`, type: 'info', closable: true, customizeProfileId: profileId,
                title: 'Tip: shorter tweets get more engagement',
                message: 'Tweets under 100 characters typically get more retweets and replies. Consider trimming, or customize X with a punchier version.',
            });
        }
        if (text.length > 280) {
            result.push({ key: `x-${profileId}-too-long`, type: 'error', closable: false, customizeProfileId: profileId,
                title: `Tweet too long (${text.length}/280)`,
                message: `Trim ${text.length - 280} characters, split into a thread, or customize this profile with a shorter version.`,
            });
        }
        return result;
    }

    // ── Error checks ─────────────────────────────────────────────────────────

    fbProfileHasError(profileId: string) { return this.state.getDisplayText(profileId).length > 10000; }
    liProfileHasError(profileId: string) { return this.state.getDisplayText(profileId).length > 3000; }
    igProfileHasError(profileId: string) { return this.state.getDisplayText(profileId).length > 2200; }
    xProfileHasError(profileId: string)  { return this.state.getDisplayText(profileId).length > 280; }

    hasFbErrors = computed(() => this.state.facebookProfiles().some(p => this.fbProfileHasError(p.id)));
    hasLiErrors = computed(() => this.state.linkedinProfiles().some(p => this.liProfileHasError(p.id)));
    hasIgErrors = computed(() => this.state.instagramProfiles().some(p => this.igProfileHasError(p.id)));
    hasXErrors  = computed(() => this.state.twitterProfiles().some(p => this.xProfileHasError(p.id)));

    errCount = computed(() => {
        let n = 0;
        n += this.state.facebookProfiles().filter(p => this.fbProfileHasError(p.id)).length;
        n += this.state.linkedinProfiles().filter(p => this.liProfileHasError(p.id)).length;
        n += this.state.instagramProfiles().filter(p => this.igProfileHasError(p.id)).length;
        n += this.state.twitterProfiles().filter(p => this.xProfileHasError(p.id)).length;
        return n;
    });

    warnCount = computed(() => {
        const d = this.dismissed();
        let n = 0;
        for (const p of this.state.facebookProfiles())  n += this.fbValidations(p.id).filter(v => v.type !== 'error' && !d.has(v.key)).length;
        for (const p of this.state.linkedinProfiles())  n += this.liValidations(p.id).filter(v => v.type !== 'error' && !d.has(v.key)).length;
        for (const p of this.state.instagramProfiles()) n += this.igValidations(p.id).filter(v => v.type !== 'error' && !d.has(v.key)).length;
        for (const p of this.state.twitterProfiles())   n += this.xValidations(p.id).filter(v => v.type !== 'error' && !d.has(v.key)).length;
        return n;
    });

    okCount = computed(() => Math.max(0, this.state.selectedProfiles().length - this.errCount()));

    // ── Display helpers ──────────────────────────────────────────────────────

    liDisplayText(profileId: string) {
        const t = this.state.getDisplayText(profileId);
        return t.length > 700 ? t.substring(0, 700) : t;
    }

    igCaptionPreview(profileId: string) {
        const t = this.state.getDisplayText(profileId);
        return t.length > 125 ? t.substring(0, 125) : t;
    }

    truncate(text: string, max: number) {
        return text?.length > max ? text.substring(0, max) + '…' : text;
    }
}
