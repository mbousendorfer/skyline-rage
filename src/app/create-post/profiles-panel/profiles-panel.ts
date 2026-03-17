import { CheckboxComponent } from '@agorapulse/ui-components/checkbox';
import { AvatarComponent } from '@agorapulse/ui-components/avatar';
import { SymbolComponent } from '@agorapulse/ui-symbol';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComposeStateService, Profile, ProfileGroup } from '../compose-state';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-profiles-panel',
    imports: [CheckboxComponent, AvatarComponent, SymbolComponent, FormsModule],
    template: `
        <div class="profiles-panel">
            <div class="panel-header">Social Profiles</div>

            <div class="search-box">
                <ap-symbol symbolId="search" size="xs" color="basic-grey"></ap-symbol>
                <input
                    type="text"
                    placeholder="Search..."
                    [(ngModel)]="searchQuery"
                    (ngModelChange)="onSearch($event)" />
                @if (searchQuery()) {
                    <button class="clear-search" (click)="clearSearch()">
                        <ap-symbol symbolId="close" size="xs" color="basic-grey"></ap-symbol>
                    </button>
                }
            </div>

            <div class="profiles-tabs">
                <button class="tab-btn" [class.active]="activeTab() === 'profiles'" (click)="activeTab.set('profiles')">Profiles</button>
                <button class="tab-btn" [class.active]="activeTab() === 'queues'" (click)="activeTab.set('queues')">Queues</button>
            </div>

            @if (activeTab() === 'profiles') {
                <div class="select-all">
                    <ap-checkbox name="select-all" [checked]="state.allSelected()" (change)="state.toggleAll($event)">
                        Select all
                    </ap-checkbox>
                </div>

                <div class="groups-list">
                    @for (group of filteredGroups(); track group.id) {
                        <div class="group">
                            <div class="group-header" (click)="state.toggleGroup(group.id)">
                                <ap-checkbox
                                    [name]="'group-' + group.id"
                                    [checked]="isGroupChecked(group)"
                                    [indeterminate]="isGroupIndeterminate(group)"
                                    (change)="toggleGroupProfiles(group, $event)">
                                </ap-checkbox>
                                <span class="group-name">{{ group.name }}</span>
                                <ap-symbol
                                    [symbolId]="group.expanded ? 'chevron-up' : 'chevron-down'"
                                    size="xs"
                                    color="basic-grey">
                                </ap-symbol>
                            </div>
                            @if (group.expanded) {
                                <div class="group-profiles">
                                    @for (profile of filterProfiles(group.profiles); track profile.id) {
                                        <div class="profile-item" (click)="state.toggleProfile(profile.id, !profile.checked)">
                                            <ap-checkbox
                                                [name]="profile.id"
                                                [checked]="profile.checked"
                                                (change)="state.toggleProfile(profile.id, $event)">
                                            </ap-checkbox>
                                            <ap-avatar
                                                [username]="profile.name"
                                                [network]="profile.network"
                                                [size]="24">
                                            </ap-avatar>
                                            <span class="profile-name">{{ profile.name }}</span>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }

                    @if (filteredUngrouped().length > 0) {
                        <div class="ungrouped-profiles">
                            @for (profile of filteredUngrouped(); track profile.id) {
                                <div class="profile-item" (click)="state.toggleProfile(profile.id, !profile.checked)">
                                    <ap-checkbox
                                        [name]="profile.id"
                                        [checked]="profile.checked"
                                        (change)="state.toggleProfile(profile.id, $event)">
                                    </ap-checkbox>
                                    <ap-avatar
                                        [username]="profile.name"
                                        [network]="profile.network"
                                        [size]="24">
                                    </ap-avatar>
                                    <span class="profile-name">{{ profile.name }}</span>
                                </div>
                            }
                        </div>
                    }
                </div>

                @if (state.selectedProfiles().length > 0) {
                    <div class="selected-summary">
                        <span class="selected-count">{{ state.selectedProfiles().length }} profile{{ state.selectedProfiles().length > 1 ? 's' : '' }} selected</span>
                    </div>
                }
            } @else {
                <div class="queues-empty">
                    <ap-symbol symbolId="clock" size="md" color="basic-grey"></ap-symbol>
                    <span>No queues configured</span>
                </div>
            }
        </div>
    `,
    styles: [`
        :host { display: flex; flex-direction: column; min-height: 0; flex: 0 0 220px; }
        .profiles-panel {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            width: 220px;
            min-width: 220px;
            border-right: 1px solid var(--sys-border-color-default);
            background: var(--ref-color-white);
            overflow: hidden;
        }

        .panel-header {
            padding: 10px 14px;
            font-size: 12px;
            font-weight: 600;
            color: var(--sys-text-color-default);
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        .search-box {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;

            input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 12px;
                color: var(--sys-text-color-default);
                background: transparent;
                font-family: 'Open Sans', sans-serif;

                &::placeholder {
                    color: var(--ref-color-grey-60);
                }
            }
        }

        .clear-search {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            opacity: 0.6;
            &:hover { opacity: 1; }
        }

        .profiles-tabs {
            display: flex;
            padding: 8px 12px;
            gap: 4px;
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        .tab-btn {
            flex: 1;
            padding: 5px 10px;
            border: 1px solid var(--sys-border-color-default);
            border-radius: 4px;
            background: transparent;
            font-size: 12px;
            font-weight: 500;
            color: var(--sys-text-color-light);
            cursor: pointer;
            transition: all 0.15s;
            font-family: 'Open Sans', sans-serif;

            &.active {
                background: var(--ref-color-electric-blue-05);
                border-color: var(--ref-color-electric-blue-40);
                color: var(--ref-color-electric-blue-100);
            }

            &:hover:not(.active) {
                background: var(--ref-color-grey-05);
            }
        }

        .select-all {
            padding: 8px 12px;
            border-bottom: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        .groups-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }

        .group-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            color: var(--sys-text-color-light);

            &:hover {
                background: var(--ref-color-grey-05);
            }

            .group-name {
                flex: 1;
                font-size: 12px;
                font-weight: 600;
                color: var(--sys-text-color-default);
            }
        }

        .group-profiles {
            padding-left: 4px;
        }

        .profile-item {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 5px 12px;
            cursor: pointer;
            border-radius: 4px;
            margin: 0 4px;
            transition: background 0.1s;

            &:hover {
                background: var(--ref-color-grey-05);
            }
        }

        .ungrouped-profiles {
            padding-top: 4px;
            border-top: 1px solid var(--ref-color-grey-10);
            margin-top: 4px;
        }

        .profile-name {
            font-size: 12px;
            color: var(--sys-text-color-default);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }

        .selected-summary {
            padding: 8px 12px;
            border-top: 1px solid var(--sys-border-color-default);
            flex-shrink: 0;
        }

        .selected-count {
            font-size: 11px;
            color: var(--ref-color-electric-blue-100);
            font-weight: 500;
        }

        .queues-empty {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: var(--ref-color-grey-60);
            font-size: 12px;
        }
    `],
})
export class ProfilesPanelComponent {
    state = inject(ComposeStateService);

    searchQuery = signal('');
    activeTab = signal<'profiles' | 'queues'>('profiles');

    filteredGroups = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (!q) return this.state.groups();
        return this.state.groups()
            .map(g => ({
                ...g,
                expanded: true,
                profiles: g.profiles.filter(p => p.name.toLowerCase().includes(q)),
            }))
            .filter(g => g.profiles.length > 0);
    });

    filteredUngrouped = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (!q) return this.state.ungroupedProfiles();
        return this.state.ungroupedProfiles().filter(p => p.name.toLowerCase().includes(q));
    });

    onSearch(query: string): void {
        this.searchQuery.set(query);
    }

    clearSearch(): void {
        this.searchQuery.set('');
    }

    filterProfiles(profiles: Profile[]): Profile[] {
        const q = this.searchQuery().toLowerCase();
        if (!q) return profiles;
        return profiles.filter(p => p.name.toLowerCase().includes(q));
    }

    isGroupChecked(group: ProfileGroup): boolean {
        return group.profiles.length > 0 && group.profiles.every(p => p.checked);
    }

    isGroupIndeterminate(group: ProfileGroup): boolean {
        return group.profiles.some(p => p.checked) && !group.profiles.every(p => p.checked);
    }

    toggleGroupProfiles(group: ProfileGroup, checked: boolean): void {
        group.profiles.forEach(p => this.state.toggleProfile(p.id, checked));
    }
}
