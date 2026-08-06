import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { ButtonComponent } from '@agorapulse/ui-components/button';
import { DotStepperComponent } from '@agorapulse/ui-components/dot-stepper';
import { IconButtonComponent } from '@agorapulse/ui-components/icon-button';
import { InfoboxComponent } from '@agorapulse/ui-components/infobox';
import { TagComponent } from '@agorapulse/ui-components/tag';
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
    imports: [AvatarComponent, ButtonComponent, DotStepperComponent, IconButtonComponent, InfoboxComponent, TagComponent, TooltipDirective, SymbolComponent],
    template: `
        <div class="preview-panel">
            <div class="panel-header">Social Media Previews</div>

            <!-- Status bar — errors are clickable and scroll to first error -->
            <div class="status-bar">
                @if (okCount() > 0) {
                    <span class="status ready">
                        <ap-symbol symbolId="rounded-check" size="xs" color="basic-grey"></ap-symbol>
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
                    <ap-symbol symbolId="eye-on" size="lg" color="basic-grey"></ap-symbol>
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
                                    <ap-icon-button [symbolId]="fbExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat"></ap-icon-button>
                                </div>
                            </div>
                            @if (fbExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.facebookProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <ap-button [config]="{style:'ghost',color:'blue'}" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">{{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}</ap-button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <ap-tag color="blue">Customized</ap-tag>
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
                                                    <ap-avatar [username]="profile.name" [size]="40"></ap-avatar>
                                                    <div class="post-meta">
                                                        <div class="post-author">{{ profile.name }}</div>
                                                        <div class="post-date">27 November at 13:37 · <ap-symbol symbolId="web" size="xs" color="basic-grey"></ap-symbol></div>
                                                    </div>
                                                    <ap-symbol class="net-more" symbolId="more" size="sm" color="basic-grey"></ap-symbol>
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
                                                            <ap-dot-stepper class="carousel-dots"
                                                                [items]="state.getDisplayMedia(profile.id)"
                                                                [index]="getCarouselIndex(profile.id)"
                                                                [interactive]="true"
                                                                (dotClick)="setCarouselIndex(profile.id, $event)">
                                                            </ap-dot-stepper>
                                                        }
                                                    </div>
                                                }
                                                <div class="fb-engagement">
                                                    <span class="fb-reactions"><ap-symbol symbolId="ns-facebook_like" size="xs" color="facebook"></ap-symbol> 128</span>
                                                    <span class="fb-counts">12 comments · 3 shares</span>
                                                </div>
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
                                    <ap-icon-button [symbolId]="liExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat"></ap-icon-button>
                                </div>
                            </div>
                            @if (liExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.linkedinProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <ap-button [config]="{style:'ghost',color:'blue'}" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">{{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}</ap-button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <ap-tag color="blue">Customized</ap-tag>
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
                                                    <ap-avatar [username]="profile.name" [size]="48"></ap-avatar>
                                                    <div class="post-meta">
                                                        <div class="post-author">{{ profile.name }}</div>
                                                        <div class="li-sub">Social media management · 12,480 followers</div>
                                                        <div class="post-date">1h · <ap-symbol symbolId="web" size="xs" color="basic-grey"></ap-symbol></div>
                                                    </div>
                                                    <ap-symbol class="net-more" symbolId="more" size="sm" color="basic-grey"></ap-symbol>
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
                                                            <ap-dot-stepper class="carousel-dots"
                                                                [items]="state.getDisplayMedia(profile.id)"
                                                                [index]="getCarouselIndex(profile.id)"
                                                                [interactive]="true"
                                                                (dotClick)="setCarouselIndex(profile.id, $event)">
                                                            </ap-dot-stepper>
                                                        }
                                                    </div>
                                                }
                                                <div class="li-social">
                                                    <span class="li-reactions"><ap-symbol symbolId="ns-linkedin_like" size="xs" color="linkedin"></ap-symbol> 88</span>
                                                    <span class="li-counts">14 comments · 6 reposts</span>
                                                </div>
                                                <div class="li-actions">
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_like" size="sm" color="basic-grey"></ap-symbol> Like</button>
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_comment" size="sm" color="basic-grey"></ap-symbol> Comment</button>
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_repost" size="sm" color="basic-grey"></ap-symbol> Repost</button>
                                                    <button class="li-btn"><ap-symbol symbolId="ns-linkedin_share" size="sm" color="basic-grey"></ap-symbol> Send</button>
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
                                    <ap-icon-button [symbolId]="igExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat"></ap-icon-button>
                                </div>
                            </div>
                            @if (igExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.instagramProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <ap-button [config]="{style:'ghost',color:'blue'}" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">{{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}</ap-button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <ap-tag color="blue">Customized</ap-tag>
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
                                                    <span class="ig-author">{{ profile.name }}</span>
                                                    <ap-symbol class="net-more" symbolId="more" size="sm" color="basic-grey"></ap-symbol>
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
                                                            <ap-dot-stepper class="carousel-dots"
                                                                [items]="state.getDisplayMedia(profile.id)"
                                                                [index]="getCarouselIndex(profile.id)"
                                                                [interactive]="true"
                                                                (dotClick)="setCarouselIndex(profile.id, $event)">
                                                            </ap-dot-stepper>
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
                                                <div class="ig-likes">1,234 likes</div>
                                                @if (state.collaborators().length > 0) {
                                                    <div class="ig-collaborators">
                                                        <span class="ig-collab-with">With</span>
                                                        @for (c of state.collaborators(); track c.handle) {
                                                            <img class="ig-collab-avatar" [src]="c.avatar" [alt]="c.name" [title]="c.handle" />
                                                        }
                                                    </div>
                                                }
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
                                                <div class="ig-postdate">2 hours ago</div>
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
                                    <ap-symbol symbolId="x-official" size="sm" color="twitter"></ap-symbol>
                                    <span>X (Twitter)</span>
                                </div>
                                <div class="network-right">
                                    <span class="posts-count">{{ state.twitterProfiles().length }} post(s)</span>
                                    <ap-icon-button [symbolId]="xExpanded() ? 'chevron-up' : 'chevron-down'" ariaLabel="Toggle" type="flat"></ap-icon-button>
                                </div>
                            </div>
                            @if (xExpanded()) {
                                <div class="preview-cards">
                                    @for (profile of state.twitterProfiles(); track profile.id) {
                                        <div class="preview-card-wrapper" [id]="'pcard-' + profile.id" [class.is-customized]="state.isCustomized(profile.id)">
                                            <div class="customize-bar" [class.is-customized]="state.isCustomized(profile.id)">
                                                <ap-button [config]="{style:'ghost',color:'blue'}" (click)="state.openCustomization(profile.id)" [apTooltip]="state.isCustomized(profile.id) ? 'Edit the override for this profile' : 'Add a network-specific text override for this post'" apTooltipPosition="left" [apTooltipShowDelay]="600">{{ state.isCustomized(profile.id) ? 'Edit override' : 'Customize' }}</ap-button>
                                                @if (state.isCustomized(profile.id)) {
                                                    <ap-tag color="blue">Customized</ap-tag>
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
                                                <div class="x-header">
                                                    <ap-avatar [username]="profile.name" [size]="40"></ap-avatar>
                                                    <div class="x-meta">
                                                        <span class="x-name">{{ profile.name }}</span>
                                                        <span class="x-handle">&#64;{{ xHandle(profile.name) }} · 1h</span>
                                                    </div>
                                                    <ap-symbol class="net-more" symbolId="more" size="sm" color="basic-grey"></ap-symbol>
                                                </div>
                                                <div class="x-text">{{ truncate(state.getDisplayText(profile.id), 280) }}</div>
                                                <div class="x-actions">
                                                    <span class="x-action"><ap-symbol symbolId="ns-x_comment" size="xs" color="basic-grey"></ap-symbol> 12</span>
                                                    <span class="x-action"><ap-symbol symbolId="ns-x_repost" size="xs" color="basic-grey"></ap-symbol> 4</span>
                                                    <span class="x-action"><ap-symbol symbolId="ns-x_like" size="xs" color="basic-grey"></ap-symbol> 86</span>
                                                    <span class="x-action"><ap-symbol symbolId="ns-x_view" size="xs" color="basic-grey"></ap-symbol> 2.4K</span>
                                                    <span class="x-action-right">
                                                        <ap-symbol symbolId="ns-x_bookmark" size="xs" color="basic-grey"></ap-symbol>
                                                        <ap-symbol symbolId="ns-x_share" size="xs" color="basic-grey"></ap-symbol>
                                                    </span>
                                                </div>
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
            background: var(--ref-color-grey-bg); overflow: hidden;
        }
        .status-bar {
            display: flex; gap: var(--ref-spacing-sm); padding: var(--ref-spacing-xxs) var(--ref-spacing-sm); align-items: center;
            background: var(--ref-color-grey-bg); border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }
        .status {
            display: flex; align-items: center; gap: var(--ref-spacing-xxxs); font-size: var(--sys-text-style-caption-size); font-weight: var(--sys-text-style-caption-weight);
            &.ready { color: var(--sys-text-color-light); }
            &.warn  { color: var(--ref-color-orange-100); }
            &.err   { color: var(--ref-color-red-100); }
        }
        button.status.clickable {
            background: none; border: none; cursor: pointer;
            padding: var(--ref-spacing-xxxs) var(--ref-spacing-xxs); border-radius: var(--sys-border-radius-sm);
            font-family: var(--ref-font-family); font-size: var(--sys-text-style-caption-bold-size); font-weight: var(--sys-text-style-caption-bold-weight);
            transition: background 0.15s;
            &.err { color: var(--ref-color-red-100);    &:hover { background: var(--ref-color-red-10); } }
            &.warn { color: var(--ref-color-orange-100); &:hover { background: var(--ref-color-orange-10); } }
        }
        .empty-state {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: var(--ref-spacing-xs); padding: var(--ref-spacing-md); text-align: center;
            p { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); margin: 0; line-height: var(--sys-text-style-caption-line-height); }
        }
        .previews-list {
            flex: 1; min-height: 0; overflow-y: auto; background: var(--ref-color-grey-bg);
            display: flex; flex-direction: column; align-items: center;
            scroll-behavior: smooth;
        }
        .network-section { width: 100%; max-width: 500px; padding: var(--ref-spacing-sm) var(--ref-spacing-sm) 0; }
        .network-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 0 var(--ref-spacing-xs); cursor: pointer;
        }
        .network-title { display: flex; align-items: center; gap: var(--ref-spacing-xxs); font-size: var(--sys-text-style-body-bold-size); font-weight: var(--sys-text-style-body-bold-weight); line-height: var(--sys-text-style-body-bold-line-height); color: var(--sys-text-color-default); }
        .network-right { display: flex; align-items: center; gap: var(--ref-spacing-xxs); }
        .posts-count { font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); }
        /* Kept hand-built: Badge is blue/orange only and Status renders a pill, not a bare dot. */
        .net-error-dot {
            width: var(--ref-spacing-xxs); height: var(--ref-spacing-xxs); border-radius: 50%;
            background: var(--ref-color-red-100); flex-shrink: 0;
        }

        .preview-cards { padding: 0 0 var(--ref-spacing-sm); }
        .preview-card-wrapper {
            margin-bottom: var(--ref-spacing-xxs); scroll-margin-top: var(--ref-spacing-xs); border-radius: var(--sys-border-radius-md);
            &.is-customized {
                background: var(--ref-color-electric-blue-05);
                border-radius: var(--sys-border-radius-lg);
                padding: 0 var(--ref-spacing-xxs) var(--ref-spacing-xxs);
                margin-left: calc(-1 * var(--ref-spacing-xxs)); margin-right: calc(-1 * var(--ref-spacing-xxs));
                margin-bottom: var(--ref-spacing-xxxs);
            }
        }

        /* Customize bar */
        .customize-bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--ref-spacing-xxs) 0;
            &.is-customized {
                background: var(--ref-color-electric-blue-10);
                border-radius: var(--sys-border-radius-lg) var(--sys-border-radius-lg) 0 0;
                padding: var(--ref-spacing-xxs) var(--ref-spacing-xs);
            }
        }

        /* Infoboxes */
        .validation-item { margin-bottom: var(--ref-spacing-xxxs); }

        /* ─────────────────────────────────────────────────────────────────────
           Post cards — faux social feed. Deliberately OUTSIDE the Agorapulse DS:
           they reproduce each network's own chrome so the user can judge the real
           rendering. Colours come from src/_network-chrome.scss (--fb-*, --li-*,
           --ig-*, --x-*, --net-*); the px type scales below are the networks' own.
           Nothing here may be tokenized to DS colour tokens — see that file.
           ───────────────────────────────────────────────────────────────────── */
        .fb-card, .li-card, .ig-card, .x-card {
            border: 1px solid var(--sys-border-color-default);
            border-radius: var(--sys-border-radius-md); overflow: hidden; background: var(--ref-color-white);
            font-family: var(--net-font-family);
            &.has-error { border-color: var(--ref-color-red-60); }
        }
        .net-more { margin-left: auto; cursor: pointer; flex-shrink: 0; }

        .post-header { display: flex; align-items: center; gap: var(--ref-spacing-xxs); padding: var(--ref-spacing-xxs) var(--ref-spacing-xs); }
        .post-meta { flex: 1; }
        .post-author { font-size: var(--sys-text-style-body-bold-size); font-weight: var(--sys-text-style-body-bold-weight); color: var(--sys-text-color-default); }
        .post-date { display: flex; align-items: center; gap: var(--ref-spacing-xxxs); font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-light); }
        .post-text { padding: var(--ref-spacing-xxxs) var(--ref-spacing-xs) var(--ref-spacing-xxs); font-size: var(--sys-text-style-body-size); color: var(--sys-text-color-default); line-height: var(--sys-text-style-body-line-height); }
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
        /* Hand-built: no DS component for a media carousel arrow. Scrim from the network layer. */
        .carousel-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            background: var(--net-scrim); border: none; border-radius: 50%;
            width: var(--ref-spacing-md); height: var(--ref-spacing-md); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s; z-index: 2;
            &:hover:not(:disabled) { background: var(--net-scrim-hover); }
            &:disabled { opacity: 0.25; cursor: default; }
            &.prev { left: var(--ref-spacing-xxs); }
            &.next { right: var(--ref-spacing-xxs); }
        }
        /* DS Dot Stepper, positioned over the media. .dots inside is width:100% + centered. */
        .carousel-dots {
            position: absolute; bottom: var(--ref-spacing-xxs); left: 0; right: 0; z-index: 2;
        }
        .see-more { font-size: var(--sys-text-style-caption-bold-size); color: var(--ref-color-electric-blue-100); cursor: pointer; font-weight: var(--sys-text-style-caption-bold-weight); }

        /* ── Facebook — real look ── */
        .fb-card .post-author { font-size: 15px; font-weight: 600; color: var(--fb-text); line-height: 1.2; }
        .fb-card .post-date { font-size: 13px; color: var(--fb-text-muted); }
        .fb-card .post-text { font-size: 15px; color: var(--fb-text); line-height: 1.3333; padding: 4px 12px 10px; }
        .fb-engagement { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; font-size: 13px; color: var(--fb-text-muted); border-bottom: 1px solid var(--fb-divider); }
        .fb-reactions { display: flex; align-items: center; gap: 5px; }
        .fb-actions { display: flex; padding: 4px; }
        .fb-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 8px; background: none; border: none; border-radius: 6px;
            font-size: 15px; font-weight: 600; color: var(--fb-text-muted); cursor: pointer; font-family: inherit;
            &:hover { background: var(--fb-action-hover); }
        }
        /* Agorapulse chrome again below — the first-comment preview is our UI, not Facebook's */
        .first-comment-preview {
            display: flex; align-items: flex-start; gap: var(--ref-spacing-xxs);
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs); border-top: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-grey-bg);
        }
        .comment-bubble {
            flex: 1; background: var(--ref-color-grey-05); border-radius: var(--sys-border-radius-lg);
            padding: var(--ref-spacing-xxs) var(--ref-spacing-xs); font-size: var(--sys-text-style-caption-size); color: var(--sys-text-color-default); line-height: var(--sys-text-style-caption-line-height);
        }
        /* ── LinkedIn — real look ── */
        .li-card .post-header { align-items: flex-start; }
        .li-card .post-author { font-size: 14px; font-weight: 600; color: var(--li-text); line-height: 1.28; }
        .li-sub { font-size: 12px; color: var(--li-text-muted); line-height: 1.33; }
        .li-card .post-date { font-size: 12px; color: var(--li-text-muted); }
        .li-card .post-text { font-size: 14px; color: var(--li-text); line-height: 1.43; }
        .li-social { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; font-size: 12px; color: var(--li-text-muted); border-bottom: 1px solid var(--li-divider); }
        .li-reactions { display: flex; align-items: center; gap: 4px; }
        .li-actions { display: flex; padding: 4px; }
        .li-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 10px 4px; background: none; border: none; border-radius: 4px;
            font-size: 14px; font-weight: 600; color: var(--li-text-muted); cursor: pointer; font-family: inherit;
            &:hover { background: var(--li-action-hover); }
        }
        /* ── Instagram — real look ── */
        .ig-card { border-color: var(--ig-border); }
        .ig-header { display: flex; align-items: center; gap: 10px; padding: 8px 14px; }
        .ig-author { font-size: 14px; font-weight: 600; color: var(--ig-text); }
        .ig-actions { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 4px; }
        .ig-actions-left { display: flex; gap: 16px; }
        .ig-likes { padding: 2px 14px; font-size: 14px; font-weight: 600; color: var(--ig-text); }
        .ig-caption { padding: 2px 14px 4px; font-size: 14px; color: var(--ig-text); line-height: 1.4; }
        .ig-caption strong, .ig-first-comment strong { font-weight: 600; }
        .ig-caption .see-more { color: var(--ig-text-muted); font-weight: 400; }
        .ig-first-comment { padding: 4px 14px; font-size: 14px; color: var(--ig-text); }
        .ig-postdate { padding: 4px 14px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2px; color: var(--ig-text-muted); }
        .ig-collaborators { display: flex; align-items: center; gap: 6px; padding: 4px 14px; }
        .ig-collab-with { font-size: 12px; color: var(--ig-text-muted); }
        .ig-collab-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--ig-avatar-ring); }

        /* ── X (Twitter) — real look ── */
        .x-card { padding-bottom: 4px; }
        .x-header { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px 2px; }
        .x-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
        .x-name { font-size: 15px; font-weight: 700; color: var(--x-text); }
        .x-handle { font-size: 14px; color: var(--x-text-muted); }
        .x-text { padding: 2px 14px 10px; font-size: 15px; color: var(--x-text); line-height: 1.35; }
        .x-actions { display: flex; align-items: center; justify-content: space-between; padding: 2px 14px 8px; }
        .x-action { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--x-text-muted); }
        .x-action-right { display: flex; align-items: center; gap: 16px; }
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

    xHandle(name: string): string {
        return name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }
}
