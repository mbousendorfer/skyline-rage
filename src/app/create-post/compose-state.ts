import { Injectable, signal, computed } from '@angular/core';

export interface Profile {
    id: string;
    name: string;
    network: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
    checked: boolean;
}

export interface ProfileGroup {
    id: string;
    name: string;
    expanded: boolean;
    profiles: Profile[];
}

export interface Customization {
    profileId: string;
    text: string;
    firstComment: boolean;
    firstCommentText: string;
    /** Per-profile media override. Empty = inherit base media. */
    mediaItems: MediaItem[];
}

export interface MediaItem {
    id: number;
    url: string;
    /** Original width in pixels (used for aspect-ratio validation). */
    width: number;
    /** Original height in pixels. */
    height: number;
    type: 'image' | 'video';
}

@Injectable({ providedIn: 'root' })
export class ComposeStateService {
    // ── Media ────────────────────────────────────────────────────────────────
    mediaItems = signal<MediaItem[]>([
        { id: 1, url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=320&h=180&fit=crop', width: 4208, height: 2370, type: 'image' },
    ]);

    hasMedia = computed(() => this.mediaItems().length > 0);

    /** True when any media item has a non-square, non-4:5 aspect ratio (landscape). */
    hasLandscapeMedia = computed(() =>
        this.mediaItems().some(m => {
            const ratio = m.width / m.height;
            return ratio > 1.1; // wider than tall = landscape
        })
    );

    addMediaItem(item: MediaItem): void {
        this.mediaItems.update(list => [...list, item]);
    }

    removeMediaItem(id: number): void {
        this.mediaItems.update(list => list.filter(m => m.id !== id));
    }

    // ── Base text ────────────────────────────────────────────────────────────
    baseText = signal(
        'Do you use Figma? It is one of the best tools to create screens. There is also Sketch and Adobe XD but it is not as efficient as Figma. Have you ever used @usertag for your prototypes? They released a web version that is totally free. Quite nice !\n\nFigma has revolutionized the way design teams collaborate. With its real-time multiplayer editing, designers and developers can work side by side without losing context. The component system, auto-layout, and variants have made it the industry standard for UI design.\n\nBut beyond just design, Figma has also introduced prototyping, FigJam for whiteboarding, and now Dev Mode — making it a complete workspace for product teams. Whether you\'re a solo freelancer or part of a 500-person organization, Figma scales beautifully.\n\nHave you made the switch yet? Drop a comment below! 👇 #Design #Figma #UX #ProductDesign #NoCode'
    );
    isDraft = signal(false);
    activeCampaign = signal<string | null>(null);

    // ── Customizations ───────────────────────────────────────────────────────
    /** All per-profile customizations. Pre-seeded with one FB card. */
    customizations = signal<Customization[]>([
        { profileId: 'ap-fb', text: "J'aime beaucoup cette salle de bain", firstComment: false, firstCommentText: '', mediaItems: [] },
    ]);

    /**
     * When set, the compose panel scrolls to and highlights this profile's
     * customization card. The panel resets it to null after handling.
     */
    focusedCustomizationId = signal<string | null>(null);

    isCustomized(profileId: string): boolean {
        return this.customizations().some(c => c.profileId === profileId);
    }

    getCustomization(profileId: string): Customization | undefined {
        return this.customizations().find(c => c.profileId === profileId);
    }

    getDisplayText(profileId: string): string {
        return this.getCustomization(profileId)?.text ?? this.baseText();
    }

    /** Returns per-profile media override if non-empty, otherwise base media. */
    getDisplayMedia(profileId: string): MediaItem[] {
        const custom = this.getCustomization(profileId);
        if (custom && custom.mediaItems.length > 0) return custom.mediaItems;
        return this.mediaItems();
    }

    /** Open a customization card (create if absent), then focus it. */
    openCustomization(profileId: string): void {
        if (!this.isCustomized(profileId)) {
            this.customizations.update(list => [
                ...list,
                { profileId, text: this.baseText(), firstComment: false, firstCommentText: '', mediaItems: [] },
            ]);
        }
        this.focusedCustomizationId.set(profileId);
    }

    removeCustomization(profileId: string): void {
        this.customizations.update(list => list.filter(c => c.profileId !== profileId));
    }

    updateCustomizationText(profileId: string, text: string): void {
        this.customizations.update(list =>
            list.map(c => (c.profileId === profileId ? { ...c, text } : c))
        );
    }

    updateCustomizationFirstComment(profileId: string, enabled: boolean): void {
        this.customizations.update(list =>
            list.map(c => (c.profileId === profileId ? { ...c, firstComment: enabled } : c))
        );
    }

    updateCustomizationFirstCommentText(profileId: string, text: string): void {
        this.customizations.update(list =>
            list.map(c => (c.profileId === profileId ? { ...c, firstCommentText: text } : c))
        );
    }

    resetCustomization(profileId: string): void {
        this.customizations.update(list =>
            list.map(c => (c.profileId === profileId ? { ...c, text: this.baseText() } : c))
        );
    }

    addCustomizationMedia(profileId: string, item: MediaItem): void {
        this.customizations.update(list =>
            list.map(c => c.profileId === profileId ? { ...c, mediaItems: [...c.mediaItems, item] } : c)
        );
    }

    removeCustomizationMedia(profileId: string, id: number): void {
        this.customizations.update(list =>
            list.map(c => c.profileId === profileId ? { ...c, mediaItems: c.mediaItems.filter(m => m.id !== id) } : c)
        );
    }

    // ── Network-level options ────────────────────────────────────────────────
    fbFirstComment = signal(false);
    fbFirstCommentText = signal('');
    fbVideoTitle = signal('');

    igFirstComment = signal(false);
    igFirstCommentText = signal('');
    igMobileNotif = signal(false);
    igPulseLink = signal(false);
    igAlsoShareToFeed = signal(true);

    liFirstComment = signal(false);
    liFirstCommentText = signal('');

    xTwitterCard = signal(false);
    xThread = signal(false);

    ttAllowComments = signal(true);
    ttAllowDuet = signal(true);
    ttAllowStitch = signal(true);
    ttMobileNotif = signal(false);

    ytTitle = signal('');
    ytPrivacy = signal<'public' | 'private'>('public');
    ytEmbeddable = signal(false);
    ytNotifySubscribers = signal(false);
    ytMadeForKids = signal(false);

    // ── Profiles ────────────────────────────────────────────────────────────
    groups = signal<ProfileGroup[]>([
        {
            id: 'g1',
            name: 'Group name',
            expanded: true,
            profiles: [
                { id: 'ap-fb', name: 'Agorapulse Facebook', network: 'facebook', checked: true },
                { id: 'ap-x', name: 'Agorapulse X', network: 'twitter', checked: true },
                { id: 'ap-ig', name: 'Agorapulse Instagram', network: 'instagram', checked: true },
                { id: 'ap-li', name: 'Agorapulse LinkedIn', network: 'linkedin', checked: true },
            ],
        },
        {
            id: 'g2',
            name: 'Group name',
            expanded: false,
            profiles: [
                { id: 'g2-fb', name: 'Brand Facebook', network: 'facebook', checked: false },
                { id: 'g2-ig', name: 'Brand Instagram', network: 'instagram', checked: false },
            ],
        },
        {
            id: 'g3',
            name: 'Group name',
            expanded: false,
            profiles: [
                { id: 'g3-li', name: 'Corp LinkedIn', network: 'linkedin', checked: false },
                { id: 'g3-x', name: 'Corp X', network: 'twitter', checked: false },
            ],
        },
    ]);

    ungroupedProfiles = signal<Profile[]>([
        { id: 'other-fb', name: 'Other Facebook', network: 'facebook', checked: false },
        { id: 'other-x', name: 'Other X', network: 'twitter', checked: false },
        { id: 'other-ig', name: 'Other Instagram', network: 'instagram', checked: false },
        { id: 'ap-yt', name: 'Agorapulse YouTube', network: 'youtube', checked: true },
        { id: 'ap-tt', name: 'Agorapulse TikTok', network: 'tiktok', checked: true },
    ]);

    // ── Derived ─────────────────────────────────────────────────────────────
    allProfiles = computed(() => [
        ...this.groups().flatMap(g => g.profiles),
        ...this.ungroupedProfiles(),
    ]);

    selectedProfiles = computed(() => this.allProfiles().filter(p => p.checked));

    facebookProfiles = computed(() => this.selectedProfiles().filter(p => p.network === 'facebook'));
    instagramProfiles = computed(() => this.selectedProfiles().filter(p => p.network === 'instagram'));
    linkedinProfiles = computed(() => this.selectedProfiles().filter(p => p.network === 'linkedin'));
    twitterProfiles = computed(() => this.selectedProfiles().filter(p => p.network === 'twitter'));
    youtubeProfiles = computed(() => this.selectedProfiles().filter(p => p.network === 'youtube'));
    tiktokProfiles = computed(() => this.selectedProfiles().filter(p => p.network === 'tiktok'));

    allSelected = computed(() => {
        const all = this.allProfiles();
        return all.length > 0 && all.every(p => p.checked);
    });

    /** Customizations that belong to currently selected profiles */
    activeCustomizations = computed(() =>
        this.customizations().filter(c =>
            this.selectedProfiles().some(p => p.id === c.profileId)
        )
    );

    // ── Char counts ──────────────────────────────────────────────────────────
    fbCharLimit = 10000;
    fbCharsRemaining = computed(() => this.fbCharLimit - this.baseText().length);

    igCharLimit = 2200;
    igCharsRemaining = computed(() => this.igCharLimit - this.baseText().length);

    liCharLimit = 3000;
    liCharsRemaining = computed(() => this.liCharLimit - this.baseText().length);

    twitterCharLimit = 280;
    twitterCharsRemaining = computed(() => this.twitterCharLimit - this.baseText().length);

    // ── Profile mutations ────────────────────────────────────────────────────
    toggleGroup(groupId: string): void {
        this.groups.update(groups =>
            groups.map(g => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
        );
    }

    toggleProfile(profileId: string, checked: boolean): void {
        this.groups.update(groups =>
            groups.map(g => ({
                ...g,
                profiles: g.profiles.map(p => (p.id === profileId ? { ...p, checked } : p)),
            }))
        );
        this.ungroupedProfiles.update(profiles =>
            profiles.map(p => (p.id === profileId ? { ...p, checked } : p))
        );
    }

    toggleAll(checked: boolean): void {
        this.groups.update(groups =>
            groups.map(g => ({ ...g, profiles: g.profiles.map(p => ({ ...p, checked })) }))
        );
        this.ungroupedProfiles.update(profiles => profiles.map(p => ({ ...p, checked })));
    }
}
